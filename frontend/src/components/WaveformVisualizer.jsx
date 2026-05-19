import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useState } from 'react';

export default function WaveformVisualizer({ audioUrl, file }) {
  const containerRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#2650ea',
      progressColor: '#6090fa',
      cursorColor: '#90b4fd',
      barWidth: 2,
      barRadius: 2,
      barGap: 1,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
    });

    if (audioUrl) wavesurfer.current.load(audioUrl);
    else if (file) wavesurfer.current.loadBlob(file);

    wavesurfer.current.on('ready', () => setDuration(wavesurfer.current.getDuration()));
    wavesurfer.current.on('audioprocess', (t) => setCurrentTime(t));
    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));

    return () => wavesurfer.current?.destroy();
  }, [audioUrl, file]);

  function toggle() {
    wavesurfer.current?.playPause();
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={toggle}
          className="w-10 h-10 bg-brand-600 hover:bg-brand-500 rounded-full flex items-center justify-center transition-colors shrink-0"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="flex-1">
          <div ref={containerRef} className="waveform-container" />
        </div>
        <Volume2 size={18} className="text-gray-500 shrink-0" />
      </div>
      <div className="flex justify-between text-xs text-gray-500 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
