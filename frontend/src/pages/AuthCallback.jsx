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
  const [mainStatus, setMainStatus] = useState('Signing you in');
  const [subStatus, setSubStatus] = useState('Completing authentication…');

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh') ?? undefined;

    if (!token) {
      navigate('/login');
      return;
    }

    setTokens(token, refresh);

    const phrases = [
      'Initializing secure handshake…',
      'Validating your session…',
      'Loading your profile…',
      'Preparing your workspace…',
      'Almost there…',
      'Done.',
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
      }

      if (progressValue < 100) {
        timeouts.push(window.setTimeout(advanceSimulation, Math.random() * 400 + 200));
      }
    };

    const finalizeSuccess = () => {
      if (canceled) return;
      setMainStatus('Welcome back');
      setSubStatus('Redirecting to your dashboard…');
      timeouts.push(
        window.setTimeout(() => {
          if (!canceled) navigate('/upload');
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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

      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    return () => {
      canceled = true;
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [navigate, params, setAuth, setTokens]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white font-body">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_72%)] pointer-events-none" />
      <div
        className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)',
        }}
      />

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-40 z-0" />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="mb-10 relative flex items-center justify-center w-28 h-28">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
          <div className="absolute inset-4 rounded-full border border-white/15" />
          <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.35)]" />
        </div>

        <div className="text-center space-y-3 max-w-md">
          <h1 className="font-headline text-2xl font-bold tracking-tight text-white">{mainStatus}</h1>
          <p className="text-sm text-gray-400">{subStatus}</p>
        </div>

        <div className="mt-10 w-64 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </main>
    </div>
  );
}
