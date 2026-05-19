import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function BillingSuccess() {
  const { setUser } = useAuthStore();
  const bgRef = useRef(null);
  const [countdown, setCountdown] = useState(5);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    const progressBar = document.getElementById('progress-bar');
    const syncText = document.getElementById('sync-text');
    const ctaContainer = document.getElementById('cta-container');

    const progressTimer = window.setTimeout(() => {
      if (progressBar) progressBar.style.width = '100%';
    }, 100);

    const syncTimer = window.setTimeout(() => {
      setSyncComplete(true);
      if (syncText) {
        syncText.innerText = 'ENCRYPTION SYNC COMPLETE';
        syncText.classList.remove('text-outline');
        syncText.classList.add('text-sonic-lime');
      }

      if (ctaContainer) {
        ctaContainer.classList.remove('opacity-0', 'translate-y-4');
        ctaContainer.classList.add('opacity-100', 'translate-y-0');
      }

      const timer = window.setInterval(() => {
        setCountdown((current) => {
          if (current <= 1) {
            window.clearInterval(timer);
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
        bgRef.current.style.transform = `translate(${(x - 0.5) * 10}px, ${(y - 0.5) * 10}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(syncTimer);
      window.clearTimeout(profileTimer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setUser]);

  return (
    <div className="bg-primary-container text-on-surface font-body-md min-h-screen flex flex-col overflow-hidden">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .scanning::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #D7FF5A, transparent);
          animation: scanline 4s linear infinite;
          opacity: 0.3;
        }
        .success-glow {
          box-shadow: 0 0 40px -10px rgba(215, 255, 90, 0.3);
        }
        .stagger-1 { animation-delay: 100ms; }
        .stagger-2 { animation-delay: 200ms; }
        .stagger-3 { animation-delay: 300ms; }
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-0">
        <img
          ref={bgRef}
          alt="Atmospheric obsidian sound wave textures"
          className="w-full h-full object-cover opacity-60 mix-blend-screen transition-transform duration-100 ease-out"
          src="https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-primary-container/40"></div>
      </div>

      <main className="relative z-10 flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div className="max-w-xl w-full animate-scale-in">
          <div className="glass-panel rounded-xl p-8 md:p-12 text-center relative overflow-hidden success-glow border border-surface-variant/40">
            <div className="absolute inset-0 scanning pointer-events-none"></div>

            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-sonic-lime/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
              <span className="material-symbols-outlined text-[80px] text-sonic-lime leading-none relative" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>

            <h1 className="font-display text-headline-xl mb-4 text-on-surface tracking-tight">You're all set!</h1>

            <p className="font-body-md text-on-surface-variant max-w-sm mx-auto mb-10 stagger-1 opacity-0 animate-scale-in">
              Your Pro Access is now active. We've unlocked the full Spectral Suite and updated your encryption keys.
            </p>

            <div className="grid grid-cols-2 gap-unit bg-surface-container-lowest/50 p-4 rounded-lg border border-outline-variant/30 mb-10 stagger-2 opacity-0 animate-scale-in">
              <div className="text-left">
                <span className="font-label-sm text-outline block mb-1">PLAN</span>
                <span className="font-label-md text-secondary-fixed">SPECTRAL ELITE</span>
              </div>
              <div className="text-right">
                <span className="font-label-sm text-outline block mb-1">STATUS</span>
                <div className="flex items-center justify-end gap-2">
                  <div className="w-2 h-2 rounded-full bg-sonic-lime"></div>
                  <span className="font-label-md text-on-surface">ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 mb-10 stagger-3 opacity-0 animate-scale-in" id="sync-indicator">
              <div className="w-48 h-[2px] bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-sonic-lime w-0 transition-all duration-[2000ms] ease-out shadow-[0_0_8px_#D7FF5A]" id="progress-bar"></div>
              </div>
              <span className={`font-label-sm tracking-widest uppercase ${syncComplete ? 'text-sonic-lime' : 'text-outline'}`} id="sync-text">
                Initializing Profile Sync...
              </span>
            </div>

            <div className="opacity-0 translate-y-4 transition-all duration-700 delay-1000" id="cta-container">
              <Link
                to="/dashboard"
                className="w-full bg-sonic-lime text-primary-container font-label-md py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim hover:shadow-[0_0_30px_rgba(215,255,90,0.4)] active:scale-95 transition-all group"
              >
                GO TO DASHBOARD
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <p className="mt-4 font-label-sm text-outline">
                Redirecting in <span id="countdown">{countdown}</span>s
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-8 px-margin-desktop bg-transparent">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-surface-variant/20 pt-8">
          <span className="font-label-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</span>
          <div className="flex gap-6">
            <a className="font-label-sm text-outline hover:text-sonic-lime transition-colors" href="#">Architecture</a>
            <a className="font-label-sm text-outline hover:text-sonic-lime transition-colors" href="#">Privacy</a>
            <a className="font-label-sm text-outline hover:text-sonic-lime transition-colors" href="#">Terms of Resonance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
