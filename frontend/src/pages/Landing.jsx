import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// 👉 Large symmetrical portraits filling the screen
const ARTISTS = [
  // LEFT SIDE - Large portraits
  { src: '/artists/artist-1.jpg',  name: 'DRAKE',        cls: 'w-64 h-96 top-[5%]    left-[2%]',    d: 0.5  },
  { src: '/artists/artist-3.jpg',  name: 'ED SHEERAN',   cls: 'w-56 h-80 top-[52%]   left-[1%]',    d: 0.35 },
  { src: '/artists/artist-4.jpg',  name: 'EMINEM',       cls: 'w-72 h-96 bottom-[2%] left-[8%]',    d: 0.7  },
  
  // CENTER LEFT - Medium portraits
  { src: '/artists/artist-7.webp', name: 'GREEN DAY',    cls: 'w-52 h-72 top-[12%]   left-[25%]',   d: 1.1  },
  { src: '/artists/artist-9.webp', name: 'LOCAL TRAIN',  cls: 'w-56 h-80 bottom-[8%] left-[28%]',   d: 0.75 },
  
  // CENTER RIGHT - Medium portraits
  { src: '/artists/artist-8.jpg',  name: 'KARAN AUJLA',  cls: 'w-52 h-72 top-[12%]   right-[25%]',  d: 0.6  },
  { src: '/artists/artist-6.jpg',  name: 'NF',           cls: 'w-56 h-80 bottom-[8%] right-[28%]',  d: 0.85 },
  
  // RIGHT SIDE - Large portraits
  { src: '/artists/artist-2.webp', name: 'THE WEEKND',   cls: 'w-64 h-96 top-[5%]    right-[2%]',   d: 0.9  },
  { src: '/artists/artist-5.avif', name: 'LINKIN PARK',  cls: 'w-72 h-96 top-[52%]   right-[1%]',   d: 0.45 },
];

const FEATURES = [
  { icon: 'graphic_eq',  title: 'Deep Audio Analysis', desc: 'BPM, key, mood, energy and spectral centroid — extracted in seconds.' },
  { icon: 'fingerprint', title: 'Song Identification', desc: 'Fingerprinting matches your audio against 100M+ tracks.' },
  { icon: 'album',       title: 'Spotify Enrichment',  desc: 'Cover art, metadata and previews pulled in on every match.' },
  { icon: 'bolt',        title: 'Real-time Pipeline',  desc: 'WebSocket job updates keep you in sync from upload to result.' },
];

const STATS = [
  { value: '100M+', label: 'Tracks in database' },
  { value: '<3s',   label: 'Avg analysis time' },
  { value: '99.8%', label: 'ID accuracy' },
  { value: '6',     label: 'Audio dimensions' },
];

// paste-safe helper so we never need inline double-brace styles
const depth = (d) => ({ '--d': d });

export default function Landing() {
  const { token } = useAuthStore();
  const galleryRef = useRef(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--mx', (x * 22).toFixed(2) + 'px');
        el.style.setProperty('--my', (y * 22).toFixed(2) + 'px');
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const hideTile = (e) => {
    const tile = e.currentTarget.closest('.gallery-tile');
    if (tile) tile.style.display = 'none';
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#050505] text-white font-body">
      {/* NAV */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-8">
        <span className="font-headline text-lg tracking-[0.25em] text-white">BEATZY</span>
        <div className="hidden md:flex items-center gap-10 text-xs tracking-[0.1em] uppercase text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs tracking-[0.1em] uppercase text-gray-400 hover:text-white transition">Login</Link>
        </div>
      </nav>

      {/* HERO — SINGLE SCREEN, NO SCROLL */}
      <section className="relative flex items-center justify-center h-[calc(100vh-6rem)] px-4">
        {/* Subtle vignette */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_70%)] pointer-events-none" />
        
        <div ref={galleryRef} className="hero-gallery">
          {ARTISTS.map((a, i) => (
            <Link to="/register" key={i} className={`gallery-tile ${a.cls}`} style={depth(a.d)}>
              <div className="gallery-tile-inner">
                <img src={a.src} alt="" loading="lazy" draggable="false" onError={hideTile} />
              </div>
            </Link>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl pointer-events-none">
          <p className="text-[10px] tracking-[0.4em] text-gray-400 mb-6 uppercase">Resonance Engine — V4</p>
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-8 text-white uppercase">
            Decode the DNA <br /> of any song.
          </h1>
          <p className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto font-light">
            Upload a track and Beatzy reveals its BPM, key, mood, and the artists it echoes.
          </p>
          <div className="flex items-center justify-center gap-4 pointer-events-auto">
            <Link to={token ? '/dashboard' : '/register'} className="btn-primary px-8 py-4 text-xs">
              {token ? 'OPEN APP' : 'ANALYZE TRACK'}
            </Link>
            <a href="#features" className="btn-secondary px-8 py-4 text-xs">LEARN MORE</a>
          </div>
        </div>
      </section>
    </div>
  );
}
