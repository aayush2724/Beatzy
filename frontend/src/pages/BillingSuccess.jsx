import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function BillingSuccess() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const bgRef = useRef(null);
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

    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      if (bgRef.current) {
        bgRef.current.style.transform = `translate(${(x - 0.5) * 15}px, ${(y - 0.5) * 15}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(syncTimer);
      window.clearTimeout(profileTimer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setUser, navigate]);

  return (
    <div className="bg-[#0c0818]/70 backdrop-blur-sm text-on-surface min-h-screen flex flex-col justify-between overflow-hidden relative font-body select-none">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,46,151,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,46,151,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-10"></div>
      
      {/* Pure CSS gradient background - no external images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,46,151,0.08) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(157,78,221,0.12) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0818] via-transparent to-[#0c0818]/40"></div>
      </div>

      <div className="flex-grow flex items-center justify-center p-8 z-20">
        <div className="max-w-md w-full glass-panel border border-glass-border rounded-xl p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(255,46,151,0.05)] bg-[#160f2b]/60 backdrop-blur-3xl">
          {/* Pulsing visual core */}
          <div className="mb-6 relative inline-block">
            <div className="absolute inset-0 bg-sonic-lime/10 blur-2xl rounded-full scale-150 animate-pulse"></div>
            <span className="material-symbols-outlined text-[64px] text-sonic-lime relative select-none leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <h1 className="font-headline text-2xl font-extrabold text-white tracking-tight mb-2">Security Handshake Complete</h1>
          <p className="font-sans text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto mb-8">
            Your high-fidelity Pro protocols are now authorized on this machine. Syncing license state with the neural matrix...
          </p>

          <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-glass-border p-4 rounded-lg text-left mb-8">
            <div>
              <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest block mb-0.5">Authorization ID</span>
              <span className="font-mono text-[10px] font-bold text-white uppercase">Pro Core Active</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest block mb-0.5">Sync Status</span>
              <span className="font-mono text-[10px] font-bold text-sonic-lime uppercase flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse"></span>
                Connected
              </span>
            </div>
          </div>

          {/* Sync indicator */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sonic-lime w-0 transition-all duration-[2000ms] ease-out shadow-[0_0_8px_rgba(255,46,151,0.5)]" 
                id="progress-bar"
              />
            </div>
            <span 
              className={`font-mono text-[8px] uppercase tracking-widest transition-colors ${syncComplete ? 'text-sonic-lime' : 'text-on-surface-variant/60'}`} 
              id="sync-text"
            >
              {syncComplete ? 'ENCRYPTION SYNC COMPLETE' : 'Initializing Profile Sync...'}
            </span>
          </div>

          {/* CTA redirect actions */}
          <div className={`transition-all duration-700 delay-[1200ms] ${syncComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} id="cta-container">
            <Link
              to="/dashboard"
              className="w-full bg-sonic-lime text-black font-mono text-xs font-bold uppercase tracking-wider py-3.5 rounded flex items-center justify-center gap-2 hover:bg-sonic-lime/90 hover:shadow-[0_0_20px_rgba(255,46,151,0.3)] active:scale-95 transition-all group"
            >
              Enter Dashboard
              <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <p className="mt-4 font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
              Automated redirect in <span className="text-white font-bold">{countdown}</span>s
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 px-8 z-20 border-t border-glass-border bg-transparent">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">© 2026 Beatzy AI. Protocols Reserved.</span>
          <div className="flex gap-6 font-mono text-[8px] uppercase tracking-widest">
            <a className="text-on-surface-variant hover:text-sonic-lime transition-colors" href="#">Architecture</a>
            <a className="text-on-surface-variant hover:text-sonic-lime transition-colors" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-sonic-lime transition-colors" href="#">License Suite</a>
          </div>
        </div>
      </footer>
    </div>
  );
}