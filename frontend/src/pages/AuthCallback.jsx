import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/auth';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setAuth, setTokens } = useAuthStore();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [mainStatus, setMainStatus] = useState('SYNCHRONIZING');
  const [subStatus, setSubStatus] = useState('Completing authentication protocol...');
  const [consoleLine, setConsoleLine] = useState('ENCRYPTION: AES-256');

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');

    if (!token) {
      navigate('/login');
      return;
    }

    setTokens(token, refresh);

    const phrases = [
      'Initializing secure handshake...',
      'Validating spectral signature...',
      'Calibrating neural production suite...',
      'Mapping user resonance profile...',
      'Unlocking Waveform archives...',
      'Authentication finalized.',
    ];

    const consolePhrases = [
      'HANDSHAKE: SUCCESS',
      'PACKET_SIZE: 1024KB',
      'GATEWAY: SECURE',
      'SIGNAL_RATIO: 1:1',
    ];

    let progressValue = 0;
    let phraseIndex = 0;
    let canceled = false;
    const timeouts = [];

    const advanceSimulation = () => {
      if (canceled) return;

      progressValue += Math.random() * 8;
      if (progressValue > 100) progressValue = 100;
      setProgress(progressValue);

      const targetPhraseIndex = Math.floor((progressValue / 100) * phrases.length);
      if (targetPhraseIndex !== phraseIndex && targetPhraseIndex < phrases.length) {
        phraseIndex = targetPhraseIndex;
        setSubStatus(phrases[phraseIndex]);
        setConsoleLine(consolePhrases[Math.floor(Math.random() * consolePhrases.length)]);
      }

      if (progressValue < 100) {
        timeouts.push(window.setTimeout(advanceSimulation, Math.random() * 400 + 200));
      }
    };

    const finalizeSuccess = () => {
      if (canceled) return;
      setMainStatus('AUTHORIZED');
      setSubStatus('Redirecting to your production suite...');
      setConsoleLine('HANDSHAKE: SUCCESS');
      timeouts.push(
        window.setTimeout(() => {
          if (!canceled) navigate('/dashboard');
        }, 1500),
      );
    };

    getMe()
      .then(({ data }) => {
        if (canceled) return;
        setAuth(data.data.user, token, refresh);
        toast.success('Signed in with Google!');
        progressValue = 100;
        setProgress(100);
        finalizeSuccess();
      })
      .catch(() => {
        if (!canceled) navigate('/login');
      });

    timeouts.push(window.setTimeout(advanceSimulation, 800));

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let offset = 0;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      const draw = () => {
        if (!ctx || canceled) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#c3f400';
        ctx.lineWidth = 1;

        for (let j = 0; j < 3; j += 1) {
          ctx.beginPath();
          for (let i = 0; i < canvas.width; i += 10) {
            const y = canvas.height / 2 + Math.sin(i * 0.005 + offset + j) * 100 * (j + 1) * 0.2;
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
          ctx.stroke();
        }

        offset += 0.01;
        requestAnimationFrame(draw);
      };

      resize();
      window.addEventListener('resize', resize);
      draw();

      timeouts.push(
        window.setTimeout(() => {
          window.removeEventListener('resize', resize);
        }, 0),
      );
    }

    return () => {
      canceled = true;
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [navigate, params, setAuth, setTokens]);

  return (
    <div className="relative min-h-screen bg-deep-obsidian text-on-background overflow-hidden">
      <style>{`
        :root {
          --sonic-lime: #c3f400;
          --deep-obsidian: #080808;
        }

        .sonic-ring {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ring-layer {
          position: absolute;
          border: 1px solid rgba(195, 244, 0, 0.1);
          border-radius: 50%;
          animation: pulse-ring 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .ring-layer:nth-child(1) { width: 100%; height: 100%; animation-delay: 0s; }
        .ring-layer:nth-child(2) { width: 80%; height: 80%; animation-delay: 0.5s; border-color: rgba(195, 244, 0, 0.2); }
        .ring-layer:nth-child(3) { width: 60%; height: 60%; animation-delay: 1s; border-color: rgba(195, 244, 0, 0.3); }

        .core {
          width: 12px;
          height: 12px;
          background-color: var(--sonic-lime);
          border-radius: 50%;
          box-shadow: 0 0 20px var(--sonic-lime), 0 0 40px rgba(195, 244, 0, 0.4);
          animation: core-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(0.8); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }

        @keyframes core-glow {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.2); filter: brightness(1.5); }
        }

        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(195, 244, 0, 0.05), transparent);
          animation: scan 3s linear infinite;
          pointer-events: none;
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .typing-effect::after {
          content: '|';
          animation: blink 1s infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(195,244,0,0.03)_0%,transparent_70%)]" />
        <div className="scan-line" />
      </div>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-margin-mobile md:px-margin-desktop">
        <div className="mb-12 relative">
          <div className="sonic-ring">
            <div className="ring-layer" />
            <div className="ring-layer" />
            <div className="ring-layer" />
            <div className="core" />
          </div>
          <div className="absolute inset-0 blur-[60px] bg-secondary-container/5 rounded-full" />
        </div>

        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-headline-lg text-headline-lg text-secondary-container tracking-[0.2em] uppercase transition-all duration-700" id="main-status">
            {mainStatus}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70 italic" id="sub-status">
            {subStatus}
          </p>
        </div>

        <div className="mt-12 w-64 h-[2px] bg-surface-variant/30 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-secondary-container transition-all duration-300 ease-out shadow-[0_0_10px_#c3f400]"
            id="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </main>

      <footer className="fixed bottom-0 w-full p-8 flex justify-between items-end mix-blend-screen pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-secondary-container rounded-full animate-pulse" />
            <p className="font-label-sm text-label-sm text-on-surface-variant/50 tracking-widest uppercase">
              CORE: ALPHA-9
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-on-surface-variant/20 rounded-full" />
            <p className="font-label-sm text-label-sm text-on-surface-variant/30 tracking-widest uppercase">
              NODE: OREGON-04
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-right">
          <p className="font-label-sm text-label-sm text-on-surface-variant/50 tracking-widest uppercase typing-effect" id="console-line">
            {consoleLine}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant/30 tracking-widest uppercase">
            LATENCY: 14MS
          </p>
        </div>
      </footer>

      <div className="fixed top-12 left-12 opacity-10 pointer-events-none">
        <p className="font-label-sm text-label-sm text-secondary-container writing-mode-vertical tracking-[0.5em]">
          BEATZY_AI_SYSTEM_LOAD
        </p>
      </div>
      <div className="fixed bottom-12 right-12 opacity-10 pointer-events-none group">
        <p className="font-headline-lg text-headline-lg text-on-surface tracking-tighter">Beatzy AI</p>
      </div>
    </div>
  );
}
