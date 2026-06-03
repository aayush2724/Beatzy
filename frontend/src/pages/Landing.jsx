import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  {
    icon: 'graphic_eq',
    title: 'Deep Audio Analysis',
    desc: 'BPM, key signature, mood, energy, spectral centroid — extracted with librosa in seconds.',
    accent: '#D7FF5A',
  },
  {
    icon: 'fingerprint',
    title: 'Song Identification',
    desc: 'ACRCloud fingerprinting matches your audio against 100M+ tracks with millisecond precision.',
    accent: '#8B5CF6',
  },
  {
    icon: 'album',
    title: 'Spotify Enrichment',
    desc: 'Automatic cover art, metadata, and 30-second preview pulled from Spotify upon every match.',
    accent: '#1DB954',
  },
  {
    icon: 'bolt',
    title: 'Real-time Pipeline',
    desc: 'WebSocket job updates and inline processing keep you in sync from upload to result.',
    accent: '#D7FF5A',
  },
];

const STATS = [
  { value: '100M+', label: 'Tracks in database' },
  { value: '<3s', label: 'Avg analysis time' },
  { value: '99.8%', label: 'ID accuracy' },
  { value: '6', label: 'Audio dimensions' },
];

export default function Landing() {
  const { token } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const particleRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const el = particleRef.current;
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 55; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 2 + 1;
      p.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        background:${Math.random() > 0.6 ? '#D7FF5A' : '#8B5CF6'};
        border-radius:50%;
        opacity:${Math.random() * 0.25 + 0.05};
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        animation: particleFloat ${14 + Math.random() * 18}s linear infinite;
        animation-delay:-${Math.random() * 15}s;
        pointer-events:none;
      `;
      el.appendChild(p);
    }
  }, []);

  useEffect(() => {
    function onMove(e) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const bgX = (mousePos.x / window.innerWidth - 0.5) * -18;
  const bgY = (mousePos.y / window.innerHeight - 0.5) * -18;

  return (
    <div
      className="min-h-screen text-white selection:bg-sonic-lime/30 overflow-x-hidden relative"
      style={{ background: '#050505', fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" }}
    >
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, rgba(212,255,63,0.018) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Particle layer */}
      <div ref={particleRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Pure CSS gradient orb background - no external images */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 30%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(215,255,90,0.1) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, rgba(0,245,255,0.08) 0%, transparent 50%)' }} />
      </div>

      {/* Orb glows */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed top-1/3 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(215,255,90,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.95), transparent)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sonic-lime/10 border border-sonic-lime/40 rounded flex items-center justify-center"
            style={{ boxShadow: '0 0 14px rgba(215,255,90,0.2)' }}>
            <span className="material-symbols-outlined text-sonic-lime text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-sonic-lime" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            BEATZY
          </span>
          <span className="ml-2 font-mono text-[8px] text-sonic-lime/40 uppercase tracking-widest border border-sonic-lime/20 px-1.5 py-0.5 rounded">
            v4.2
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Protocol', 'Archive', 'Terminal'].map(item => (
            <a key={item} href="#features"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-sonic-lime transition-colors duration-200">
              {item}
            </a>
          ))}
        </div>

        <Link
          to={token ? '/dashboard' : '/login'}
          className="px-5 py-2 font-mono text-[10px] uppercase tracking-[0.15em] border border-sonic-lime/30 text-sonic-lime rounded hover:bg-sonic-lime/10 hover:border-sonic-lime transition-all duration-200"
          style={{ boxShadow: '0 0 12px rgba(215,255,90,0.06)' }}>
          {token ? 'Dashboard' : 'Sign In'}
        </Link>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 z-10">

        {/* Orbital system */}
        <div className="relative flex items-center justify-center" style={{ width: 640, height: 640 }}>

          {/* Orbit rings */}
          <div className="absolute" style={{
            width: 600, height: 600,
            border: '1px dotted rgba(255,255,255,0.12)',
            borderRadius: '50%',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            animation: 'orbitSpin 50s linear infinite',
          }} />
          <div className="absolute" style={{
            width: 450, height: 450,
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '50%',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            animation: 'orbitSpin 35s linear infinite reverse',
          }} />
          <div className="absolute" style={{
            width: 300, height: 300,
            border: '1px dashed rgba(215,255,90,0.30)',
            borderRadius: '50%',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            animation: 'orbitSpin 20s linear infinite',
          }} />

          {/* Orbit dots */}
          <div className="absolute" style={{ width: 300, height: 300, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'orbitSpin 20s linear infinite' }}>
            <div style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 8, height: 8, background: '#D7FF5A', borderRadius: '50%', boxShadow: '0 0 10px rgba(215,255,90,0.8)' }} />
          </div>
          <div className="absolute" style={{ width: 450, height: 450, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'orbitSpin 35s linear infinite reverse' }}>
            <div style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 7, height: 7, background: '#8B5CF6', borderRadius: '50%', boxShadow: '0 0 10px rgba(139,92,246,0.8)' }} />
          </div>

          {/* Central glow */}
          <div className="absolute rounded-full transition-all duration-1000" style={{
            width: isPlaying ? 260 : 220, height: isPlaying ? 260 : 220,
            background: 'radial-gradient(circle, rgba(215,255,90,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)',
            filter: 'blur(30px)',
          }} />

          {/* Floating panel: BPM */}
          <div className="absolute" style={{ top: 40, right: -20, backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(215,255,90,0.2)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>BPM Sync</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#D7FF5A', lineHeight: 1 }}>128.00</p>
          </div>

          {/* Floating panel: Spectral */}
          <div className="absolute" style={{ left: -30, top: '40%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>Spectral</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 36 }}>
              {[14, 28, 20, 36, 18, 30].map((h, i) => (
                <div key={i} style={{
                  width: 5, height: isPlaying ? h * 1.3 : h, borderRadius: '2px 2px 0 0',
                  background: i % 2 === 0 ? '#D7FF5A' : '#8B5CF6',
                  transition: `height ${200 + i * 50}ms ease`,
                  animation: isPlaying ? `barPulse ${0.4 + i * 0.1}s ease-in-out infinite alternate` : 'none',
                }} />
              ))}
            </div>
          </div>

          {/* Floating panel: Sync Ratio */}
          <div className="absolute" style={{ bottom: 60, left: 20, backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(215,255,90,0.1)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>Sync Ratio</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#8B5CF6', lineHeight: 1 }}>99.8%</p>
          </div>

          {/* Central button */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="relative z-10 flex flex-col items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 group"
            style={{ width: 160, height: 160 }}
          >
            <div className="absolute inset-0 rounded-full transition-all duration-700"
              style={{
                border: `1px solid rgba(215,255,90,${isPlaying ? 0.8 : 0.3})`,
                animation: isPlaying ? 'ripple 1.5s ease-out infinite' : 'corePulse 3s ease-in-out infinite',
              }} />
            <div className="absolute rounded-full transition-all duration-500"
              style={{
                inset: 8,
                background: isPlaying ? 'rgba(215,255,90,0.06)' : 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: isPlaying ? '0 0 40px rgba(215,255,90,0.15)' : '0 0 20px rgba(0,0,0,0.5)',
              }} />
            <span
              className="material-symbols-outlined relative z-10 transition-all duration-300"
              style={{ fontSize: 52, color: isPlaying ? '#ffffff' : '#D7FF5A', fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span className="absolute font-mono text-[9px] tracking-[0.3em] text-sonic-lime/50 group-hover:text-sonic-lime/90 transition-opacity uppercase"
              style={{ bottom: -28 }}>
              {isPlaying ? 'PAUSE CIRCUIT' : 'ACTIVATE CORE'}
            </span>
          </button>
        </div>

        {/* Headline */}
        <div className="mt-16 text-center z-10 px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-sonic-lime/20 bg-sonic-lime/5">
            <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
            <span className="font-mono text-[9px] text-sonic-lime/80 uppercase tracking-[0.25em]">Resonance Active — Core v4.2</span>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#fff', marginBottom: 24 }}>
            The Future of Sound is{' '}
            <span style={{ color: '#D7FF5A', textShadow: '0 0 40px rgba(215,255,90,0.4), 0 0 80px rgba(215,255,90,0.15)' }}>
              Visible
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/45 max-w-2xl mx-auto leading-relaxed mb-12"
            style={{ fontWeight: 300 }}>
            Witness the intersection of high-fidelity audio analysis and cinematic AI intelligence.
            Identify any track, decode its DNA, and synchronize your core with the Singularity.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={token ? '/dashboard' : '/register'}
              className="px-10 py-4 font-mono text-xs uppercase tracking-[0.2em] rounded transition-all duration-200"
              style={{
                background: 'rgba(215,255,90,0.08)',
                border: '1px solid rgba(215,255,90,0.35)',
                color: '#D7FF5A',
                boxShadow: '0 0 30px rgba(215,255,90,0.08)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(215,255,90,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(215,255,90,0.08)'}
            >
              {token ? 'Open Dashboard' : 'Enter Archive'}
            </Link>
            <Link
              to="/pricing"
              className="px-10 py-4 font-mono text-xs uppercase tracking-[0.2em] rounded transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              Protocols
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-white/[0.06] py-8"
        style={{ background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#D7FF5A', lineHeight: 1, marginBottom: 6 }}>
                {value}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-28 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-sonic-lime/60 mb-4">Core Capabilities</p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Engineered for Sonic Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon, title, desc, accent }) => (
              <div key={title}
                className="group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}30`; e.currentTarget.style.boxShadow = `0 0 30px ${accent}0a`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                  <span className="material-symbols-outlined text-base" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <h3 className="font-semibold text-sm text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(215,255,90,0.04) 0%, transparent 70%)' }} />
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-sonic-lime/50 mb-5">Begin Synchronization</p>
          <h2 className="mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Your audio has a story.<br />
            <span style={{ color: '#D7FF5A' }}>Let Beatzy read it.</span>
          </h2>
          <Link
            to={token ? '/upload' : '/register'}
            className="inline-flex items-center gap-3 px-10 py-4 font-mono text-xs uppercase tracking-[0.2em] rounded transition-all duration-200"
            style={{
              background: '#D7FF5A',
              color: '#050505',
              fontWeight: 700,
              boxShadow: '0 0 40px rgba(215,255,90,0.25)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 60px rgba(215,255,90,0.4)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(215,255,90,0.25)'}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
            {token ? 'Analyze Audio' : 'Start Free'}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-6"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sonic-lime tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BEATZY</span>
          <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest">AI Core v4.2</span>
        </div>
        <div className="flex gap-8">
          {['Architecture', 'Protocol', 'Terminal'].map(item => (
            <a key={item} href="#"
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 hover:text-prism-violet transition-colors">
              {item}
            </a>
          ))}
        </div>
        <div className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
          © 2026 AI Core Synchronized
        </div>
      </footer>

      <style>{`
        @keyframes orbitSpin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes corePulse {
          0%,100% { opacity:0.6; transform:scale(1); }
          50%      { opacity:1;   transform:scale(1.04); }
        }
        @keyframes ripple {
          0%   { transform:scale(1);   opacity:0.8; }
          100% { transform:scale(1.5); opacity:0; }
        }
        @keyframes barPulse {
          from { transform:scaleY(0.7); }
          to   { transform:scaleY(1.3); }
        }
        @keyframes particleFloat {
          0%   { transform:translateY(0)   rotate(0deg);  }
          50%  { transform:translateY(-40px) rotate(180deg); }
          100% { transform:translateY(0)   rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
