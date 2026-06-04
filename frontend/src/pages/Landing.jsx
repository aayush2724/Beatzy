import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLenis } from '../hooks/useLenis';
import { useLandingScroll, DEMO_CARDS } from '../hooks/useLandingScroll';
import ThemeToggle from '../components/ThemeToggle';
import MagneticCta from '../components/landing/MagneticCta';
import { Card } from '../components/ui';
import 'lenis/dist/lenis.css';

const HeroScene = lazy(() => import('../components/landing/HeroScene'));

const ARTISTS = [
  { src: '/artists/artist-1.jpg', name: 'DRAKE' },
  { src: '/artists/artist-2.webp', name: 'THE WEEKND' },
  { src: '/artists/artist-3.jpg', name: 'ED SHEERAN' },
  { src: '/artists/artist-4.jpg', name: 'EMINEM' },
  { src: '/artists/artist-5.avif', name: 'LINKIN PARK' },
  { src: '/artists/artist-6.jpg', name: 'NF' },
  { src: '/artists/artist-7.webp', name: 'GREEN DAY' },
  { src: '/artists/artist-8.jpg', name: 'KARAN AUJLA' },
  { src: '/artists/artist-9.webp', name: 'LOCAL TRAIN' },
];

const FEATURES = [
  { icon: 'graphic_eq', title: 'Deep Audio Analysis', desc: 'BPM, key, mood, energy and spectral centroid — extracted in seconds.' },
  { icon: 'fingerprint', title: 'Song Identification', desc: 'AcoustID fingerprinting matches your audio against millions of tracks.' },
  { icon: 'album', title: 'Metadata Enrichment', desc: 'Cover art, album info and previews pulled in on every match.' },
  { icon: 'bolt', title: 'Real-time Pipeline', desc: 'WebSocket job updates keep you in sync from upload to result.' },
];

const STATS = [
  { value: '100M+', label: 'Tracks in database', animate: false },
  { value: '3', label: 'Avg analysis (sec)', animate: true, suffix: 's', prefix: '<' },
  { value: '99.8', label: 'ID accuracy', animate: true, suffix: '%' },
  { value: '6', label: 'Audio dimensions', animate: true, suffix: '' },
];

const STEPS = [
  { icon: 'upload_file', title: 'Upload', desc: 'Drop any track — MP3, WAV, FLAC up to 50MB.' },
  { icon: 'analytics', title: 'Analyze', desc: 'Neural pipeline extracts tempo, key, mood, and chords.' },
  { icon: 'insights', title: 'Decode', desc: 'Full spectral report with lyrics, chords, and artist echoes.' },
];

export default function Landing() {
  const { token } = useAuthStore();
  const galleryRef = useRef(null);
  const heroTitle = useRef(null);
  const heroCta = useRef(null);
  const statRef0 = useRef(null);
  const statRef1 = useRef(null);
  const statRef2 = useRef(null);
  const statRef3 = useRef(null);
  const stepsPin = useRef(null);
  const stepPanel0 = useRef(null);
  const stepPanel1 = useRef(null);
  const stepPanel2 = useRef(null);
  const galleryTrack = useRef(null);
  const featureCards = useRef(null);

  useLenis(true);

  const scrollRefs = useRef({
    heroTitle,
    heroCta,
    statValues: [statRef0, statRef1, statRef2, statRef3],
    stepsPin,
    stepPanels: [stepPanel0, stepPanel1, stepPanel2],
    galleryTrack,
    featureCards,
  });
  scrollRefs.current = {
    heroTitle,
    heroCta,
    statValues: [statRef0, statRef1, statRef2, statRef3],
    stepsPin,
    stepPanels: [stepPanel0, stepPanel1, stepPanel2],
    galleryTrack,
    featureCards,
  };
  useLandingScroll(scrollRefs.current);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--mx', `${(x * 14).toFixed(2)}px`);
        el.style.setProperty('--my', `${(y * 14).toFixed(2)}px`);
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const hideTile = (e) => {
    const tile = e.currentTarget.closest('.hero-mosaic-tile');
    if (tile) tile.style.visibility = 'hidden';
  };

  return (
    <div className="relative min-h-screen bg-bg text-accent font-body">
      <nav className="fixed top-0 left-0 right-0 z-[var(--z-sticky)] flex items-center justify-between px-6 md:px-12 py-6 bg-gradient-to-b from-bg to-transparent">
        <span className="font-display text-lg tracking-[0.25em]">BEATZY</span>
        <div className="hidden md:flex items-center gap-10 text-xs tracking-[0.1em] uppercase text-muted">
          <a href="#features" className="link-sweep hover:text-accent transition">Features</a>
          <a href="#how-it-works" className="link-sweep hover:text-accent transition">How it works</a>
          <a href="#demo-gallery" className="link-sweep hover:text-accent transition">Examples</a>
          <Link to="/pricing" className="link-sweep hover:text-accent transition">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="text-xs tracking-[0.1em] uppercase text-muted hover:text-accent transition hidden sm:inline">
            Login
          </Link>
          <Link to={token ? '/dashboard' : '/register'} className="btn-primary px-5 py-2.5 text-xs hidden sm:inline-block">
            {token ? 'OPEN APP' : 'GET STARTED'}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div ref={galleryRef} className="hero-mosaic" style={{ transform: 'translate3d(var(--mx, 0), var(--my, 0), 0)' }}>
          {ARTISTS.map((a, i) => (
            <Link to="/register" key={i} className="hero-mosaic-tile" aria-label={a.name}>
              <img src={a.src} alt="" loading={i < 4 ? 'eager' : 'lazy'} draggable="false" onError={hideTile} />
            </Link>
          ))}
        </div>

        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>

        <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--bg)_65%)] pointer-events-none" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-bg/80 via-transparent to-bg pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl px-6 pt-24 pb-16 pointer-events-none">
          <p data-reveal className="text-[10px] tracking-[0.4em] text-muted mb-6 uppercase">Resonance Engine — V4</p>
          <h1 ref={heroTitle} className="font-display text-display leading-[1.05] tracking-tight mb-8 uppercase">
            <span data-reveal className="block">Decode the DNA</span>
            <span data-reveal className="block">of any song.</span>
          </h1>
          <p data-reveal className="text-muted text-fluid-body mb-10 max-w-2xl mx-auto font-light">
            Upload a track and Beatzy reveals its BPM, key, mood, chords, and the artists it echoes.
          </p>
          <div ref={heroCta} className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
            <MagneticCta to={token ? '/dashboard' : '/register'}>
              {token ? 'OPEN APP' : 'ANALYZE TRACK'}
            </MagneticCta>
            <a href="#features" className="btn-secondary px-8 py-4 text-xs">LEARN MORE</a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 border-y border-glass-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => {
            const statRefs = [statRef0, statRef1, statRef2, statRef3];
            return (
              <div key={s.label} className="text-center">
                <div
                  ref={statRefs[i]}
                  data-value={s.animate ? s.value : undefined}
                  data-prefix={s.prefix || ''}
                  data-suffix={s.suffix || ''}
                  className="font-display text-3xl md:text-4xl font-bold mb-2"
                >
                  {s.animate ? `${s.prefix || ''}0${s.suffix || ''}` : `${s.prefix || ''}${s.value}${s.suffix || ''}`}
                </div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-widest">{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PINNED HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10">
        <div ref={stepsPin} className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.3em] mb-4">Pipeline</p>
          <h2 className="font-display text-fluid-h2 text-center uppercase tracking-tight mb-12">How it works</h2>
          <div className="relative w-full max-w-lg min-h-[280px]">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                ref={[stepPanel0, stepPanel1, stepPanel2][i]}
                className="absolute inset-0 flex flex-col items-center text-center glass-panel p-10 border border-glass-border"
              >
                <span className="material-symbols-outlined text-5xl mb-6">{step.icon}</span>
                <span className="font-mono text-[10px] text-muted mb-2">0{i + 1}</span>
                <h3 className="font-display text-2xl uppercase tracking-wide mb-3">{step.title}</h3>
                <p className="text-muted text-sm max-w-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HORIZONTAL DEMO GALLERY */}
      <section id="demo-gallery" className="relative z-10 border-t border-glass-border">
        <div className="demo-gallery-wrap">
          <div className="w-full">
            <p className="font-mono text-[10px] text-muted uppercase tracking-[0.3em] text-center mb-8 px-6">Example analyses</p>
            <div ref={galleryTrack} className="demo-gallery-track">
              {DEMO_CARDS.map((card) => (
                <div key={card.title} className="demo-card">
                  <p className="font-display text-lg font-bold mb-4">{card.title}</p>
                  <div className="grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-wider">
                    <div>
                      <span className="text-muted block mb-1">BPM</span>
                      <span className="text-accent font-bold text-sm">{card.bpm}</span>
                    </div>
                    <div>
                      <span className="text-muted block mb-1">Key</span>
                      <span className="text-accent font-bold text-sm">{card.key}</span>
                    </div>
                    <div>
                      <span className="text-muted block mb-1">Mood</span>
                      <span className="text-accent font-bold text-sm">{card.mood}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24 border-t border-glass-border">
        <p className="font-mono text-[10px] text-muted uppercase tracking-[0.3em] mb-4 text-center">Capabilities</p>
        <h2 className="font-display text-fluid-h2 text-center uppercase tracking-tight mb-16">
          Built for producers &amp; listeners
        </h2>
        <div ref={featureCards} className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="feature-tilt flex gap-6 items-start" style={{ transformStyle: 'preserve-3d' }}>
              <span className="material-symbols-outlined text-3xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-glass-border bg-surface/20">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-fluid-h2 uppercase tracking-tight mb-6">Ready to decode?</h2>
          <p className="text-muted mb-10">Free tier includes 5 analyses per month. Upgrade anytime.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <MagneticCta to={token ? '/upload' : '/register'}>{token ? 'UPLOAD TRACK' : 'START FREE'}</MagneticCta>
            <Link to="/pricing" className="btn-secondary px-8 py-4 text-xs">VIEW PRICING</Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-glass-border px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-display text-sm tracking-[0.2em]">BEATZY</span>
          <div className="flex flex-wrap justify-center gap-8 text-xs tracking-[0.1em] uppercase text-muted">
            <a href="#features" className="link-sweep hover:text-accent transition">Features</a>
            <Link to="/pricing" className="link-sweep hover:text-accent transition">Pricing</Link>
            <Link to="/login" className="link-sweep hover:text-accent transition">Login</Link>
            <Link to="/privacy" className="link-sweep hover:text-accent transition">Privacy</Link>
            <Link to="/terms" className="link-sweep hover:text-accent transition">Terms</Link>
          </div>
          <span className="font-mono text-[9px] text-muted uppercase tracking-widest">© 2026 Beatzy</span>
        </div>
      </footer>
    </div>
  );
}
