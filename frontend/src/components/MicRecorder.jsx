import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Mic, Pause, Play, Square } from 'lucide-react';

// Chrome/Firefox record webm; Safari (and every iOS browser) only records mp4.
// Asking for webm-or-ogg alone made the MediaRecorder constructor throw there.
const RECORDING_TYPES = [
  { mime: 'audio/webm;codecs=opus', ext: 'webm' },
  { mime: 'audio/webm', ext: 'webm' },
  { mime: 'audio/mp4', ext: 'mp4' },
  { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
];

// The analyser needs a couple of seconds to find a beat or a chord.
const MIN_RECORDING_SECONDS = 3;

function pickRecordingType() {
  if (typeof MediaRecorder === 'undefined') return null;
  return RECORDING_TYPES.find((t) => MediaRecorder.isTypeSupported(t.mime)) || { mime: '', ext: 'webm' };
}

function extForMime(mime) {
  if (mime.includes('mp4') || mime.includes('aac')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function MicRecorder({ onRecorded, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const durationRef = useRef(0);
  // Set on unmount so the recorder's onstop doesn't upload a capture the user
  // walked away from (switching tabs used to submit it for analysis).
  const discardRef = useRef(false);

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      discardRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      releaseMic();
    };
  }, []);

  const startRecording = async () => {
    const recordingType = pickRecordingType();
    if (!recordingType || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      discardRef.current = false;
      durationRef.current = 0;

      // Set up audio analysis for volume visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(Math.min(100, (average / 256) * 150));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Set up media recorder
      const mediaRecorder = recordingType.mime
        ? new MediaRecorder(stream, { mimeType: recordingType.mime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Label the file with what the recorder actually produced — it used
        // to be called .webm/audio/webm even when it wasn't.
        const mime = (mediaRecorder.mimeType || recordingType.mime || 'audio/webm').split(';')[0];
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        const audioFile = new File([audioBlob], `live-capture.${extForMime(mime)}`, { type: mime });
        const recordedSeconds = durationRef.current;

        releaseMic();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setVolume(0);
        audioChunksRef.current = [];

        if (discardRef.current) return;

        if (audioBlob.size === 0 || recordedSeconds < MIN_RECORDING_SECONDS) {
          toast.error(`Record at least ${MIN_RECORDING_SECONDS} seconds of audio to analyse.`);
          return;
        }

        onRecorded?.(audioFile);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);

      toast.success('Recording started', { duration: 2000 });
    } catch (error) {
      console.error('Microphone access error:', error);
      // Don't leave the mic (and its browser "recording" indicator) running.
      releaseMic();
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      toast.error(denied
        ? 'Could not access microphone. Please check permissions.'
        : `Could not start recording: ${error?.message || 'unknown error'}`);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success('Recording paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);
      toast.success('Recording resumed');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      toast.success('Processing recording...');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Level + state */}
      <div className={clsx(
        'relative w-full max-w-md rounded-2xl border p-10 transition-colors duration-300',
        isRecording ? 'border-brand/40 bg-brand/5' : 'border-line bg-surface'
      )}>
        <div className={clsx(
          'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border transition-colors duration-300',
          isRecording ? 'border-brand/40 bg-brand/10 text-brand' : 'border-line bg-veil-1 text-ink-muted'
        )}>
          {isPaused ? <Pause className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </div>

        {/* Input level: one bar per band, driven by the mic, no jitter */}
        {isRecording && !isPaused && (
          <div className="mb-5 flex h-14 items-end justify-center gap-1">
            {Array.from({ length: 16 }).map((_, i) => {
              const weight = 0.55 + 0.45 * Math.sin(((i + 1) / 17) * Math.PI);
              const h = Math.max(8, Math.min(100, volume * weight));
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-brand transition-[height] duration-100"
                  style={{ height: `${h}%`, opacity: 0.35 + Math.min(0.65, volume / 120) }}
                />
              );
            })}
          </div>
        )}

        {isRecording && (
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5">
              <span className={clsx('h-2 w-2 rounded-full', isPaused ? 'bg-warn' : 'bg-danger animate-pulse')} />
              <span className="font-mono text-lg tabular-nums text-ink">{formatDuration(duration)}</span>
            </span>
          </div>
        )}

        <p className="text-center text-sm text-ink-muted">
          {!isRecording ? 'Play the track near your microphone, then start recording.' : isPaused ? 'Paused' : 'Listening…'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button onClick={startRecording} disabled={disabled} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Mic className="h-4 w-4" /> Start recording
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button onClick={pauseRecording} className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Pause className="h-4 w-4" /> Pause
              </button>
            ) : (
              <button onClick={resumeRecording} className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Play className="h-4 w-4" /> Resume
              </button>
            )}
            <button onClick={stopRecording} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Square className="h-4 w-4 fill-current" /> Stop and analyze
            </button>
          </>
        )}
      </div>

      <p className="max-w-md text-center text-xs text-ink-faint">
        A few seconds of clear audio is enough. Noisy rooms are fine; silence is not.
      </p>
    </div>
  );
}
