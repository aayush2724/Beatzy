import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function MicRecorder({ onRecorded, disabled }) {
  const [state, setState] = useState('idle'); // idle | requesting | recording | done
  const [countdown, setCountdown] = useState(10);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  }, []);

  const start = async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'mic-recording.webm', { type: 'audio/webm' });
        setState('done');
        onRecorded(file);
      };
      mediaRef.current = recorder;
      recorder.start(100);
      setState('recording');
      setCountdown(10);
      let secs = 10;
      timerRef.current = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) { clearInterval(timerRef.current); recorder.stop(); }
      }, 1000);
    } catch {
      setState('idle');
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const progress = ((10 - countdown) / 10) * 100;

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Circular progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(215,255,90,0.08)" strokeWidth="6" />
          {state === 'recording' && (
            <motion.circle
              cx="80" cy="80" r="70" fill="none"
              stroke="#D7FF5A" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
              transition={{ duration: 0.3 }}
            />
          )}
        </svg>
        {/* Ping rings when recording */}
        {state === 'recording' && (
          <>
            <div className="absolute inset-0 rounded-full border border-sonic-lime/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 rounded-full border border-sonic-lime/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </>
        )}
        <button
          onClick={state === 'recording' ? stop : start}
          disabled={disabled || state === 'requesting' || state === 'done'}
          className={clsx(
            'relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300',
            state === 'recording'
              ? 'bg-red-500/20 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              : 'bg-sonic-lime/10 border-sonic-lime/40 hover:bg-sonic-lime/20 hover:border-sonic-lime shadow-[0_0_20px_rgba(215,255,90,0.1)]'
          )}
        >
          <span className={clsx(
            'material-symbols-outlined text-4xl transition-colors',
            state === 'recording' ? 'text-red-400' : 'text-sonic-lime'
          )} style={{ fontVariationSettings: "'FILL' 1" }}>
            {state === 'recording' ? 'stop_circle' : 'mic'}
          </span>
        </button>
      </div>

      <div className="text-center">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="font-mono text-xs text-sonic-lime uppercase tracking-widest">Ready to Listen</p>
              <p className="text-sm text-on-surface-variant mt-1">Click the mic, then hold your device near the speaker</p>
            </motion.div>
          )}
          {state === 'requesting' && (
            <motion.div key="req" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="font-mono text-xs text-prism-violet uppercase tracking-widest animate-pulse">Requesting Mic Access…</p>
            </motion.div>
          )}
          {state === 'recording' && (
            <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="font-headline text-5xl font-bold text-white tabular-nums">{countdown}</p>
              <p className="font-mono text-xs text-red-400 uppercase tracking-widest mt-1 animate-pulse">● Recording</p>
              <button onClick={stop} className="mt-3 font-mono text-[10px] text-on-surface-variant hover:text-white uppercase tracking-wider transition-colors">
                Stop Early
              </button>
            </motion.div>
          )}
          {state === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <span className="material-symbols-outlined text-sonic-lime text-3xl">check_circle</span>
              <p className="font-mono text-xs text-sonic-lime uppercase tracking-widest mt-1">Captured! Sending to analyzer…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-center">
        {[
          { icon: 'graphic_eq', label: 'Live Capture', sub: 'MediaRecorder' },
          { icon: 'fingerprint', label: 'Song ID', sub: 'ACRCloud' },
          { icon: 'mood', label: 'Mood & BPM', sub: 'ML Model' },
        ].map(f => (
          <div key={f.label} className="glass-panel p-3 rounded-lg border border-glass-border">
            <span className="material-symbols-outlined text-sonic-lime text-lg block mb-1">{f.icon}</span>
            <p className="text-[10px] font-bold text-white">{f.label}</p>
            <p className="font-mono text-[8px] text-on-surface-variant uppercase">{f.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
