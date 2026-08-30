import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/ThemeToggle';
import LandingBackground from '../components/landing/LandingBackground';
import MagneticCta from '../components/landing/MagneticCta';
import {
  ArrowUpRight,
  Waves,
  BrainCircuit,
  Music2,
  Fingerprint,
  Radar,
  Code2,
  FileAudio,
  Sparkles,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const titleLine = {
  hidden: { opacity: 0, y: 46, rotateX: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
};

const GENRES = [
  'TECHNO', 'JAZZ', 'LO-FI', 'DRUM & BASS', 'SOUL', 'HOUSE',
  'AMBIENT', 'HIP-HOP', 'CLASSICAL', 'FUNK', 'GARAGE', 'DISCO',
];

const CASSETTES = [
  { title: 'Midnight Signal', artist: 'Neon Drift', bpm: 128, key: 'F#m', mood: 'ELECTRIC', side: 'A', accent: 'brand' },
  { title: 'Glass Horizon', artist: 'Vela', bpm: 96, key: 'Dm', mood: 'MOODY', side: 'B', accent: 'warm' },
  { title: 'Chrome Tide', artist: 'Analog Youth', bpm: 117, key: 'Am', mood: 'DREAMY', side: 'A', accent: 'brand' },
];

function CassetteReel({ duration = 5, spoolSize = 'h-11 w-11' }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className={`absolute rounded-full bg-ink/15 ${spoolSize}`}></span>
      <motion.div
        className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-line-strong bg-canvas"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration, ease: 'linear' }}
      >
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-2.5 rounded-full bg-line-strong"
            style={{ transform: `rotate(${i * 60}deg) translateX(16px)` }}
          />
        ))}
        <span className="h-3 w-3 rounded-full bg-line-strong"></span>
      </motion.div>
    </div>
  );
}

function CassetteCard({ tape, i }) {
  const accentText = tape.accent === 'warm' ? 'text-accent-warm' : 'text-brand';
  return (
    <motion.article variants={fadeUp} className="tilt-card relative rounded-[2rem] border border-line bg-veil-1 p-5 backdrop-blur-xl">
      <div className="relative rounded-[1.4rem] border border-line-strong bg-raised/80 p-4">
        {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-2', 'right-2 bottom-2'].map((pos) => (
          <span key={pos} className={`absolute ${pos} h-1.5 w-1.5 rounded-full bg-line-strong`}></span>
        ))}

        {/* Label */}
        <div className="rounded-xl border border-line bg-veil-2 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-black tracking-[0.3em] ${accentText}`}>BZ-{String(i + 1).padStart(3, '0')}</p>
            <p className="text-[10px] tracking-[0.3em] text-ink-muted">SIDE {tape.side}</p>
          </div>
          <h3 className="mt-2 truncate text-2xl font-black tracking-tight text-ink">{tape.title}</h3>
          <p className="text-sm text-ink-muted">{tape.artist}</p>
          <div className="mt-3 flex flex-col gap-1">
            <span className="h-1.5 rounded-full bg-brand"></span>
            <span className="h-1.5 rounded-full bg-accent-warm"></span>
          </div>
        </div>

        {/* Tape window */}
        <div className="mt-3 flex items-center rounded-xl border border-line-strong bg-canvas/80 px-6 py-3">
          <CassetteReel duration={6} spoolSize="h-12 w-12" />
          <div className="mx-3 h-1 flex-1 rounded-full bg-ink/20"></div>
          <CassetteReel duration={4} spoolSize="h-8 w-8" />
        </div>

        {/* Stamps */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-[10px] tracking-[0.24em] text-ink-muted">{tape.bpm} BPM</span>
          <span className={`text-[10px] font-black tracking-[0.24em] ${accentText}`}>{tape.key}</span>
          <span className="text-[10px] tracking-[0.24em] text-ink-muted">{tape.mood}</span>
        </div>
      </div>
    </motion.article>
  );
}

function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { token } = useAuthStore();

  useEffect(() => {
    // Tilt card effect
    const tiltCards = document.querySelectorAll('.tilt-card');
    const onMouseMove = (e, card) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -10;
      const ry = ((x / r.width) - 0.5) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px)`;
    };
    const onMouseLeave = (card) => {
      card.style.transform = '';
    };

    tiltCards.forEach((card) => {
      const moveHandler = (e) => onMouseMove(e, card);
      const leaveHandler = () => onMouseLeave(card);
      card.addEventListener('mousemove', moveHandler);
      card.addEventListener('mouseleave', leaveHandler);
      card._handlers = { moveHandler, leaveHandler };
    });

    return () => {
      tiltCards.forEach((card) => {
        if (card._handlers) {
          card.removeEventListener('mousemove', card._handlers.moveHandler);
          card.removeEventListener('mouseleave', card._handlers.leaveHandler);
        }
      });
    };
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-transparent text-ink antialiased selection:bg-brand selection:text-brand-ink noise relative font-sans">
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md"
      >
        <nav className="mx-auto flex h-20 max-w-[1720px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 shadow-[0_0_35px_color-mix(in_oklab,var(--brand)_16%,transparent)]">
              <span className="absolute h-3 w-3 rounded-full bg-brand shadow-[0_0_22px_color-mix(in_oklab,var(--brand)_80%,transparent)]"></span>
              <span className="h-7 w-7 rounded-full border border-brand/50"></span>
            </span>
            <span className="text-sm font-semibold tracking-[0.38em] text-ink">BEATZY</span>
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            <a href="#features" onClick={scrollTo('#features')} className="text-[11px] font-medium tracking-[0.24em] text-ink-muted transition hover:text-brand">FEATURES</a>
            <a href="#how-it-works" onClick={scrollTo('#how-it-works')} className="text-[11px] font-medium tracking-[0.24em] text-ink-muted transition hover:text-brand">HOW IT WORKS</a>
            <a href="#examples" onClick={scrollTo('#examples')} className="text-[11px] font-medium tracking-[0.24em] text-ink-muted transition hover:text-brand">EXAMPLES</a>
            <Link to="/pricing" className="text-[11px] font-medium tracking-[0.24em] text-ink-muted transition hover:text-brand">PRICING</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!token && (
              <Link to="/login" className="hidden px-3 text-[11px] font-medium tracking-[0.22em] text-ink-muted transition hover:text-ink sm:inline-flex">LOGIN</Link>
            )}
            <Link
              to={token ? '/dashboard' : '/pricing'}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-5 text-xs font-black text-brand-ink shadow-[0_0_40px_color-mix(in_oklab,var(--brand)_20%,transparent)] transition hover:-translate-y-0.5 hover:shadow-[0_0_70px_color-mix(in_oklab,var(--brand)_38%,transparent)]"
            >
              {token ? 'OPEN APP' : 'GET STARTED'}
            </Link>
          </div>
        </nav>
      </motion.header>

      <main id="top" className="relative z-10">
        {/* ============ HERO ============ */}
        <section className="relative flex min-h-[860px] items-center overflow-hidden">
          <LandingBackground />
          <div className="relative z-10 mx-auto grid w-full max-w-[1720px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-10">
            <motion.div className="max-w-6xl" variants={stagger} initial="hidden" animate="show">
              <motion.div
                variants={fadeUp}
                className="mb-6 inline-flex items-center gap-3 rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-[11px] font-medium tracking-[0.28em] text-brand shadow-[0_0_50px_color-mix(in_oklab,var(--brand)_8%,transparent)]"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand shadow-[0_0_16px_color-mix(in_oklab,var(--brand)_90%,transparent)]"></span>
                RESONANCE ENGINE — V4
              </motion.div>
              <h1 className="max-w-7xl text-[clamp(3.5rem,9.2vw,8.4rem)] font-black uppercase leading-[0.88] tracking-[-0.08em] text-ink [perspective:900px]">
                <motion.span variants={titleLine} className="inline-block">Decode</motion.span><br />
                <motion.span variants={titleLine} className="inline-block text-brand">the DNA</motion.span><br />
                <motion.span variants={titleLine} className="inline-block">of any song.</motion.span>
              </h1>
              <motion.p variants={fadeUp} className="mt-8 max-w-4xl text-lg leading-8 text-ink-muted sm:text-xl">
                Upload a track and Beatzy identifies the song, fingerprints the recording, then reveals BPM, key, mood, chords, genre vectors, and API-ready audio intelligence in seconds.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
                <MagneticCta
                  to={token ? '/upload' : '/register'}
                  className="cta-3d inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand px-8 text-sm font-black uppercase tracking-[0.12em] text-brand-ink"
                >
                  Start analyzing<ArrowUpRight className="ml-2 w-5 h-5" />
                </MagneticCta>
                <a href="#examples" onClick={scrollTo('#examples')} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-veil-1 px-8 text-sm font-semibold uppercase tracking-[0.12em] text-ink transition hover:border-brand/50 hover:text-brand">
                  View API demo
                </a>
              </motion.div>
            </motion.div>

            {/* Floating analysis cards */}
            <div className="relative mx-auto hidden h-[620px] w-full max-w-[590px] perspective-[1200px] sm:block">
              <div className="orbit-dot absolute left-1/2 top-1/2 h-4 w-4 rounded-full bg-brand shadow-[0_0_26px_var(--brand)]"></div>

              <motion.div
                initial={{ opacity: 0, y: 60, rotateY: -14 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.35 }}
                className="float-card absolute left-8 top-12 w-72 rounded-[2rem] border border-line bg-veil-2 p-5 backdrop-blur-2xl glow-orange"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.26em] text-ink-muted">NOW SCANNING</span>
                  <Waves className="w-6 h-6 text-brand" />
                </div>
                <div className="equalizer flex h-32 items-end gap-2 rounded-2xl bg-surface/50 p-4">
                  <span className="w-full rounded-full bg-brand"></span>
                  <span className="w-full rounded-full bg-accent-warm"></span>
                  <span className="w-full rounded-full bg-brand"></span>
                  <span className="w-full rounded-full bg-brand"></span>
                  <span className="w-full rounded-full bg-accent-warm"></span>
                  <span className="w-full rounded-full bg-brand"></span>
                </div>
                <p className="mt-4 text-sm text-ink-muted">Fingerprint match confidence</p>
                <p className="text-4xl font-black text-ink">99.98%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 60, rotateY: 14 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.55 }}
                className="float-slow scan-sweep absolute right-0 top-48 w-80 overflow-hidden rounded-[2rem] border border-brand/25 bg-surface/80 p-6 shadow-lg backdrop-blur-2xl"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-ink">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.25em] text-ink-muted">AI AUDIO MAP</p>
                      <p className="text-xl font-black text-ink">Mood: Electric</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-ink-muted"><span>Key detection</span><span className="text-brand">F# minor</span></div>
                      <div className="h-2 rounded-full bg-veil-3"><div className="h-2 w-[84%] rounded-full bg-brand"></div></div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-ink-muted"><span>Danceability</span><span className="text-accent-warm">92</span></div>
                      <div className="h-2 rounded-full bg-veil-3"><div className="h-2 w-[92%] rounded-full bg-accent-warm"></div></div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-ink-muted"><span>Chords</span><span className="text-brand">12 found</span></div>
                      <div className="h-2 rounded-full bg-veil-3"><div className="h-2 w-[71%] rounded-full bg-brand"></div></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.75 }}
                className="float-card absolute bottom-12 left-16 w-80 rounded-[2rem] border border-line bg-veil-2 p-6 backdrop-blur-2xl"
                style={{ animationDelay: '-2.2s' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.25em] text-ink-muted">MATCH FOUND</p>
                    <p className="mt-1 text-2xl font-black text-ink">Midnight Signal</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand">
                    <Music2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-surface/40 p-3">
                    <p className="text-xl font-black text-brand">128</p>
                    <p className="text-[9px] tracking-[0.18em] text-ink-muted">BPM</p>
                  </div>
                  <div className="rounded-2xl bg-surface/40 p-3">
                    <p className="text-xl font-black text-accent-warm">8A</p>
                    <p className="text-[9px] tracking-[0.18em] text-ink-muted">CAMELOT</p>
                  </div>
                  <div className="rounded-2xl bg-surface/40 p-3">
                    <p className="text-xl font-black text-brand">0.92</p>
                    <p className="text-[9px] tracking-[0.18em] text-ink-muted">ENERGY</p>
                  </div>
                </div>
              </motion.div>

              <div className="absolute inset-20 -z-10 rounded-full border border-brand/10 shadow-[inset_0_0_80px_color-mix(in_oklab,var(--brand)_5%,transparent)]"></div>
              <div className="absolute inset-32 -z-10 rounded-full border border-line"></div>
            </div>
          </div>
        </section>

        {/* ============ GENRE MARQUEE ============ */}
        <section aria-label="Genres" className="relative border-y border-line bg-canvas/70 py-6 backdrop-blur-sm">
          <div className="marquee-wrap">
            <div className="marquee-track">
              {[0, 1].map((half) => (
                <span key={half} aria-hidden={half === 1}>
                  {GENRES.map((g) => (
                    <span key={`${half}-${g}`} className="mx-6 inline-flex items-center gap-6 text-sm font-black tracking-[0.32em] text-ink-faint">
                      {g}<span className="h-1.5 w-1.5 rounded-full bg-brand/60"></span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section aria-label="Platform statistics" className="relative py-14">
          <motion.div
            className="mx-auto grid max-w-[1500px] grid-cols-2 gap-4 px-5 md:grid-cols-4"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {[
              { val: '100M+', lab: 'TRACKS IN DATABASE' },
              { val: '<3s', lab: 'AVG ANALYSIS SEC' },
              { val: '99.8%', lab: 'ID ACCURACY' },
              { val: '6', lab: 'AUDIO DIMENSIONS' },
            ].map((stat) => (
              <motion.div key={stat.lab} variants={fadeUp} className="tilt-card rounded-[2rem] border border-line bg-veil-1 p-7 text-center backdrop-blur-xl">
                <p className="text-5xl font-black tracking-tight text-brand">{stat.val}</p>
                <p className="mt-2 text-[10px] tracking-[0.24em] text-ink-muted">{stat.lab}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ============ FEATURES ============ */}
        <section id="features" className="relative mx-auto max-w-[1720px] px-5 py-28 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-semibold tracking-[0.36em] text-brand">FEATURES</p>
            <h2 className="mt-4 text-[clamp(2.75rem,4.7vw,4.5rem)] font-black uppercase tracking-[-0.06em] text-ink">Music intelligence with depth.</h2>
            <p className="mt-5 text-lg leading-8 text-ink-muted">Every component is built for recognition, enrichment, and API-scale delivery — wrapped in a cinematic interface that feels as fast as the engine underneath.</p>
          </Reveal>
          <motion.div
            className="mt-16 grid gap-5 md:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { icon: Fingerprint, title: 'Acoustic fingerprinting', text: 'Match noisy clips, live recordings, stems, and full tracks against a massive recognition layer engineered for sub-second lookup.' },
              { icon: Radar, title: 'AI audio dimensions', text: 'Extract tempo, key, mood, energy, rhythm density, vocal presence, chords, sections, and similarity vectors for discovery systems.' },
              { icon: Code2, title: 'SaaS-ready API', text: 'Drop Beatzy into streaming apps, rights workflows, DJ tools, creator platforms, and catalog intelligence products.' },
            ].map((feat, i) => (
              <motion.article key={i} variants={fadeUp} className="tilt-card rounded-[2.5rem] border border-line bg-veil-1 p-7 backdrop-blur-xl">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-[0_0_55px_color-mix(in_oklab,var(--brand)_32%,transparent)]">
                  <feat.icon className="w-8 h-8" />
                </div>
                <p className="text-[10px] tracking-[0.28em] text-brand">0{i + 1} / {feat.title.split(' ')[0].toUpperCase()}</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-ink">{feat.title}</h3>
                <p className="mt-4 leading-7 text-ink-muted">{feat.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how-it-works" className="relative overflow-hidden border-y border-line bg-canvas/70 py-28 backdrop-blur-sm">
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/[0.045] blur-[120px]"></div>
          <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8">
            <Reveal className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.36em] text-brand">PIPELINE</p>
              <h2 className="mt-4 text-[clamp(2.75rem,4.7vw,4.5rem)] font-black uppercase tracking-[-0.06em] text-ink">How it works</h2>
            </Reveal>
            <motion.div
              className="relative mt-20 grid gap-6 lg:grid-cols-3"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="absolute left-[16%] right-[16%] top-24 hidden h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent lg:block"></div>
              {[
                { icon: FileAudio, title: 'Upload', text: 'Drop MP3, WAV, FLAC, stems, or short captured snippets into the engine.' },
                { icon: Waves, title: 'Analyze', text: 'Fingerprinting, source separation, chord inference, tempo grids, and mood models run together.' },
                { icon: Sparkles, title: 'Reveal', text: 'Return clean metadata, confidence scores, and structured JSON for product teams.' },
              ].map((step, i) => (
                <motion.article key={i} variants={fadeUp} className="tilt-card relative rounded-[2.5rem] border border-line bg-raised/80 p-8 text-center backdrop-blur-xl">
                  <div className="step-badge mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-2xl font-black text-brand-ink shadow-[0_0_70px_color-mix(in_oklab,var(--brand)_35%,transparent)]" style={{ animationDelay: `-${i * 2}s` }}>
                    0{i + 1}
                  </div>
                  <step.icon className="mx-auto mt-9 w-12 h-12 text-brand" />
                  <h3 className="mt-5 text-3xl font-black uppercase tracking-tight text-ink">{step.title}</h3>
                  <p className="mt-4 leading-7 text-ink-muted">{step.text}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============ CASSETTE ARCHIVE ============ */}
        <section id="archive" className="relative mx-auto max-w-[1720px] px-5 py-28 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-semibold tracking-[0.36em] text-brand">THE ARCHIVE</p>
            <h2 className="mt-4 text-[clamp(2.75rem,4.7vw,4.5rem)] font-black uppercase tracking-[-0.06em] text-ink">Every tape has DNA.</h2>
            <p className="mt-5 text-lg leading-8 text-ink-muted">From dusty mixtapes to studio masters — feed Beatzy any recording and it reads the tempo, key, and mood pressed into the tape.</p>
          </Reveal>
          <motion.div
            className="mt-16 grid gap-5 md:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {CASSETTES.map((tape, i) => (
              <CassetteCard key={tape.title} tape={tape} i={i} />
            ))}
          </motion.div>
        </section>

        {/* ============ EXAMPLES ============ */}
        <section id="examples" className="relative mx-auto grid max-w-[1720px] gap-10 px-5 py-28 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <Reveal>
            <p className="text-[11px] font-semibold tracking-[0.36em] text-brand">EXAMPLES</p>
            <h2 className="mt-4 text-[clamp(2.75rem,4.7vw,4.5rem)] font-black uppercase tracking-[-0.06em] text-ink">API output that sings.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-muted">Designed for developers who need a gorgeous dashboard and reliable machine-readable analysis. No guesswork. Just clean signal.</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="tilt-card overflow-hidden rounded-[2.5rem] border border-brand/25 bg-raised shadow-lg">
              <div className="flex items-center justify-between border-b border-line bg-veil-1 px-6 py-4">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-line-strong"></span>
                  <span className="h-3 w-3 rounded-full bg-accent-warm"></span>
                  <span className="h-3 w-3 rounded-full bg-brand"></span>
                </div>
                <p className="text-[10px] tracking-[0.26em] text-ink-muted">beatzy.analysis.json</p>
              </div>
              <pre className="overflow-x-auto p-6 text-sm leading-7 text-ink-muted">
                <code>{`{
  track_id: btz_9081x,
  match: Midnight Signal,
  confidence: 0.9998,
  bpm: 128,
  key: F# minor,
  mood: electric, focused,
  chords: [F#m, D, A, E],
  energy: 0.92,
  danceability: 0.88,
  api_latency_ms: 184
}`}</code>
              </pre>
            </div>
          </Reveal>
        </section>

        {/* ============ CTA BANNER ============ */}
        <section id="pricing" className="relative px-5 pb-28 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] border border-brand/25 bg-brand p-8 text-brand-ink shadow-[0_0_140px_color-mix(in_oklab,var(--brand)_22%,transparent)] md:p-12">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-[11px] font-black tracking-[0.34em] opacity-70">START BUILDING</p>
                  <h2 className="mt-3 max-w-5xl text-5xl font-black uppercase leading-[.92] tracking-[-0.07em] md:text-7xl">Turn every song into structured intelligence.</h2>
                  <p className="mt-5 max-w-4xl text-lg font-medium leading-8 opacity-80">Launch with hosted analysis, dashboard uploads, and API access for recognition-first music products.</p>
                </div>
                <Link
                  to={token ? '/upload' : '/pricing'}
                  className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-canvas px-9 text-sm font-black uppercase tracking-[0.16em] text-brand shadow-[0_18px_0_rgba(0,0,0,.25)] transition hover:-translate-y-1"
                >
                  Get started<ArrowUpRight className="ml-2 w-6 h-6" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line bg-canvas/80 px-5 py-10 backdrop-blur-sm sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1720px] flex-col items-center justify-between gap-5 md:flex-row">
          <p className="text-sm font-semibold tracking-[0.32em] text-ink">BEATZY</p>
          <p className="text-sm text-ink-muted text-center">Music intelligence engine for identification, analysis, and API access.</p>
          <div className="flex gap-5">
            <a href="#examples" onClick={scrollTo('#examples')} className="text-sm text-ink-muted transition hover:text-brand">Docs</a>
            <a href="#features" onClick={scrollTo('#features')} className="text-sm text-ink-muted transition hover:text-brand">Features</a>
            <Link to="/pricing" className="text-sm text-ink-muted transition hover:text-brand">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
