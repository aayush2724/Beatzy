import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function BillingSuccess() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    const progressTimer = window.setTimeout(() => {
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) progressBar.style.width = '100%';
    }, 100);

    const syncTimer = window.setTimeout(() => {
      setSyncComplete(true);

      const timer = window.setInterval(() => {
        setCountdown((current) => {
          if (current <= 1) {
            window.clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }, 2000);

    const profileTimer = window.setTimeout(() => {
      getMe().then(({ data }) => setUser(data.data.user)).catch(() => {});
    }, 2000);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(syncTimer);
      window.clearTimeout(profileTimer);
    };
  }, [setUser, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-ink font-body selection:bg-ink/20 flex flex-col justify-between">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--canvas)_72%)] pointer-events-none" />
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, color-mix(in_oklab,var(--ink)_5%,transparent) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex-grow flex items-center justify-center p-8">
        <div
          className="max-w-md w-full rounded-2xl p-8 text-center space-y-6"
          style={{
            background: 'rgba(20, 20, 20, 0.55)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid color-mix(in_oklab,var(--ink)_10%,transparent)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-ink/5 blur-2xl rounded-full scale-150 animate-pulse" />
            <span
              className="material-symbols-outlined text-[64px] text-ink relative select-none leading-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          <div>
            <h1 className="font-headline text-2xl font-bold text-ink tracking-tight mb-2">Payment confirmed</h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
              Your plan is active. Syncing your account…
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-ink/[0.02] border border-line p-4 rounded-lg text-left">
            <div>
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Plan</span>
              <span className="font-mono text-[10px] font-bold text-ink uppercase">Pro active</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Sync</span>
              <span className="font-mono text-[10px] font-bold text-ink uppercase flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
                Connected
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-48 h-1 bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-ink w-0 transition-all duration-[2000ms] ease-out shadow-[0_0_8px_color-mix(in_oklab,var(--ink)_25%,transparent)]"
                id="progress-bar"
              />
            </div>
            <span
              className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${
                syncComplete ? 'text-ink' : 'text-gray-500'
              }`}
            >
              {syncComplete ? 'Sync complete' : 'Initializing profile sync…'}
            </span>
          </div>

          <div className={`transition-all duration-700 delay-[1200ms] ${syncComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2 text-xs uppercase tracking-wider py-3.5">
              Enter dashboard
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <p className="mt-4 font-mono text-[9px] text-gray-500 uppercase tracking-widest">
              Redirecting in <span className="text-ink font-bold">{countdown}</span>s
            </p>
          </div>
        </div>
      </div>

      <footer className="relative z-10 w-full py-6 px-8 border-t border-line">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">© 2026 Beatzy AI</span>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-widest text-gray-500">
            <Link className="hover:text-ink transition-colors" to="/privacy">Privacy</Link>
            <Link className="hover:text-ink transition-colors" to="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
