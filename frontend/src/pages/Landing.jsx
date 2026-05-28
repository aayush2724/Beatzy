import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';

export default function Landing() {
  const { token } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const orbitalRef = useRef(null);

  // Particle background state
  useEffect(() => {
    const container = document.getElementById('particle-container');
    if (!container) return;
    container.innerHTML = ''; // Clear existing
    
    const count = 40;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'absolute w-1.5 h-1.5 bg-sonic-lime rounded-full opacity-20 pointer-events-none';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.transform = `scale(${Math.random() * 0.8 + 0.2})`;
      p.style.animation = `float ${12 + Math.random() * 16}s linear infinite`;
      p.style.animationDelay = `-${Math.random() * 10}s`;
      container.appendChild(p);
    }
  }, []);

  // Parallax background on mouse move
  useEffect(() => {
    function handleMouseMove(e) {
      const bgImage = document.getElementById('cinematic-bg-image');
      if (!bgImage) return;
      const x = (window.innerWidth - e.pageX * 2) / 80;
      const y = (window.innerHeight - e.pageY * 2) / 80;
      bgImage.style.transform = `scale(1.05) translateX(${x}px) translateY(${y}px)`;
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleListenClick = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface selection:bg-sonic-lime/30 overflow-x-hidden font-body text-body-md relative">
      

      {/* Cinematic Background Image Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          id="cinematic-bg-image"
          alt="Cinematic Music Background"
          className="w-full h-full object-cover opacity-20 grayscale-[0.3] brightness-50 transition-transform duration-700 ease-out"
          style={{ transform: 'scale(1.05)' }}
          src="https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-dim/90 via-surface-dim/40 to-surface-dim"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-surface-dim/60"></div>
      </div>

      {/* Main Content */}
      <main className="relative min-h-screen overflow-hidden flex flex-col justify-center items-center pt-32 pb-24 z-10">
        
        {/* Nebula Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-prism-violet/5 blur-[160px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-sonic-lime/5 blur-[130px] rounded-full pointer-events-none"></div>

        {/* THE AUDIO CORE (Hero Visual) */}
        <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
          {/* Inner Glowing Sphere */}
          <div className={`absolute w-36 h-36 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-sonic-lime/20 to-prism-violet/20 blur-3xl opacity-50 transition-all duration-1000 ${isPlaying ? 'scale-125 brightness-125' : ''}`}></div>

          {/* Orbital Ribbons */}
          <div ref={orbitalRef} className={`absolute inset-0 transition-all duration-1000 ${isPlaying ? 'scale-110' : ''}`}>
            <div className="absolute inset-0 border border-sonic-lime/20 rounded-[45%_55%_70%_30%/30%_60%_40%_70%] animate-[spin_25s_linear_infinite]"></div>
            <div className="absolute inset-6 border border-prism-violet/20 rounded-[55%_45%_30%_70%/60%_30%_70%_40%] animate-[spin_18s_linear_infinite_reverse]"></div>
            <div className="absolute inset-12 border border-sonic-lime/10 rounded-full"></div>
          </div>

          {/* Floating Data Panel - BPM Sync */}
          <div className="absolute -top-6 -right-12 glass-panel p-4 rounded-xl border border-sonic-lime/20 shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">BPM Sync</p>
            <p className="font-headline font-bold text-sonic-lime text-2xl tracking-tight">128.00</p>
          </div>

          {/* Floating Data Panel - Spectral Bars */}
          <div className="absolute top-1/2 -left-20 glass-panel p-4 rounded-xl border border-prism-violet/20 shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] mb-2">Spectral</p>
            <div className="flex items-end gap-1.5 h-10">
              <div className={`w-1.5 bg-sonic-lime rounded-t-full transition-all duration-300 ${isPlaying ? 'h-8 animate-pulse' : 'h-4'}`}></div>
              <div className={`w-1.5 bg-prism-violet rounded-t-full transition-all duration-300 ${isPlaying ? 'h-10 animate-pulse delay-75' : 'h-6'}`}></div>
              <div className={`w-1.5 bg-sonic-lime rounded-t-full transition-all duration-300 ${isPlaying ? 'h-6 animate-pulse delay-150' : 'h-3'}`}></div>
              <div className={`w-1.5 bg-prism-violet rounded-t-full transition-all duration-300 ${isPlaying ? 'h-9 animate-pulse delay-200' : 'h-7'}`}></div>
            </div>
          </div>

          {/* Floating Data Panel - Sync Ratio */}
          <div className="absolute -bottom-4 -left-6 glass-panel p-4 rounded-xl border border-sonic-lime/10 shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">Sync Ratio</p>
            <p className="font-headline font-bold text-prism-violet text-2xl tracking-tight">99.8%</p>
          </div>

          {/* Central Play Interface */}
          <div className="z-10 flex flex-col items-center">
            <button
              onClick={handleListenClick}
              className="group relative w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center transition-all duration-750 hover:scale-105 active:scale-95 cursor-pointer"
              id="mainListenBtn"
            >
              <div className={`absolute inset-0 rounded-full border border-sonic-lime/30 group-hover:border-sonic-lime/80 ${isPlaying ? 'border-sonic-lime animate-ping opacity-25' : 'animate-[pulse_3s_infinite]'}`}></div>
              <div className="absolute inset-2 rounded-full bg-surface-dim/60 backdrop-blur-xl border border-white/5 group-hover:bg-sonic-lime/10 transition-colors"></div>
              <span 
                className={`material-symbols-outlined text-5xl md:text-6xl text-sonic-lime transition-all duration-500 ${isPlaying ? 'text-white' : ''}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
              <span className="absolute -bottom-14 font-mono text-[10px] tracking-[0.3em] text-sonic-lime opacity-50 group-hover:opacity-100 transition-opacity">
                {isPlaying ? 'PAUSE CIRCUIT' : 'ACTIVATE CORE'}
              </span>
            </button>
          </div>
        </div>

        {/* Typography & Headline */}
        <div className="mt-24 text-center z-10 px-8">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-4xl text-balance">
            The Future of Sound is <span className="text-sonic-lime neon-glow-text">Visible</span>
          </h1>
          <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto opacity-80 leading-relaxed">
            Witness the intersection of high-fidelity audio analysis and cinematic generative visuals. Synchronize your core with the Singularity.
          </p>
        </div>

        {/* Hero Actions */}
        <div className="mt-14 flex flex-wrap justify-center gap-6 z-10">
          <Link
            to={token ? "/dashboard" : "/register"}
            className="px-10 py-4 bg-sonic-lime/10 border border-sonic-lime/30 hover:border-sonic-lime hover:bg-sonic-lime/20 rounded font-mono text-xs text-sonic-lime transition-all uppercase tracking-[0.2em] shadow-lg shadow-sonic-lime/5"
          >
            ENTER ARCHIVE
          </Link>
          <Link
            to="/pricing"
            className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded font-mono text-xs text-on-surface transition-all uppercase tracking-[0.2em]"
          >
            PROTOCOLS
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full py-12 bg-surface-container-lowest/80 border-t border-glass-border flex flex-col md:flex-row justify-between items-center px-12 gap-6 z-50">
        <div className="font-bold text-sonic-lime text-xl tracking-tight">
          Beatzy AI
        </div>
        <div className="flex gap-8">
          <a className="font-mono text-[10px] text-on-surface-variant hover:text-prism-violet transition-colors tracking-widest uppercase" href="#">Architecture</a>
          <a className="font-mono text-[10px] text-on-surface-variant hover:text-prism-violet transition-colors tracking-widest uppercase" href="#">Protocol</a>
          <a className="font-mono text-[10px] text-on-surface-variant hover:text-prism-violet transition-colors tracking-widest uppercase" href="#">Terminal</a>
        </div>
        <div className="font-mono text-[10px] text-on-surface-variant opacity-40 uppercase tracking-widest">
          © 2026 AI Core Synchronized
        </div>
      </footer>

      {/* Particles Layer */}
      <div id="particle-container" className="fixed inset-0 pointer-events-none z-0"></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </div>
  </div>
  </Layout>
);
}
