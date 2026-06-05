import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Call parent handler
        if (onRecorded) {
          onRecorded(audioFile);
        }
        
        // Reset state
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setVolume(0);
        audioChunksRef.current = [];
        
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      toast.success('Recording started', { duration: 2000 });
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Could not access microphone. Please check permissions.');
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
        setDuration(d => d + 1);
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
      {/* Recording visualization */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl" />
        
        <div className={clsx(
          'relative p-12 rounded-2xl border transition-all duration-300 backdrop-blur-xl',
          isRecording 
            ? 'border-primary/30 bg-primary/5 shadow-[0_0_40px_rgba(255,255,255,0.05)]' 
            : 'border-[#0D0808]/10 bg-white/[0.02]'
        )}>
          {/* Microphone icon */}
          <div className={clsx(
            'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300',
            isRecording 
              ? 'bg-primary/20 border-2 border-primary/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
              : 'bg-white/10 border border-[#0D0808]/20'
          )}>
            <span className={clsx(
              'material-symbols-outlined text-4xl transition-all duration-300',
              isRecording ? 'text-primary' : 'text-gray-400'
            )}>
              {isPaused ? 'pause' : 'mic'}
            </span>
          </div>

          {/* Volume bars visualization */}
          {isRecording && !isPaused && (
            <div className="flex items-end justify-center gap-1 h-16 mb-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-primary to-secondary rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(10, Math.min(100, volume + (Math.random() * 20 - 10)))}%`,
                    opacity: 0.3 + (volume / 150)
                  }}
                />
              ))}
            </div>
          )}

          {/* Duration display */}
          {isRecording && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1010]/30 rounded-full border border-[#0D0808]/10">
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  isPaused ? 'bg-secondary' : 'bg-red-500 animate-pulse'
                )} />
                <span className="font-mono text-xl text-[#FFFFFF] font-bold">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          )}

          {/* Status text */}
          <p className="text-center text-xs text-on-surface-variant font-medium uppercase tracking-widest">
            {!isRecording 
              ? 'Click below to start capture'
              : isPaused
              ? 'Recording paused'
              : 'Capture Active... Monitoring signal'
            }
          </p>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">mic</span>
            Start Capture
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="btn-secondary border-secondary/50 text-secondary hover:bg-secondary/10 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">pause</span>
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="btn-secondary border-green-500/50 text-green-500 hover:bg-green-500/10 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Resume
              </button>
            )}
            
            <button
              onClick={stopRecording}
              className="px-8 py-3 bg-red-500/80 hover:bg-red-500 text-[#FFFFFF] font-bold rounded-lg transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">stop</span>
              Stop & Analyze
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-md text-center">
        <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
          Record at least 10s of audio for optimal fingerprinting.
        </p>
      </div>
    </div>
  );
}
