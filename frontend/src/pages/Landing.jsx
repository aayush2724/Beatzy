import { useMemo, useRef, useState } from 'react';
import { motion, MotionConfig, useScroll, useTransform } from 'framer-motion';
import { Activity, ArrowUpRight, Disc3, Fingerprint, Music2, Sparkles, Timer, Waves, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PublicNav, PublicFooter } from '../components/PublicShell';
import LandingBackground from '../components/landing/LandingBackground';
import MagneticCta from '../components/landing/MagneticCta';
import ScrollProgress from '../components/landing/ScrollProgress';
import CursorRing from '../components/landing/CursorRing';
import KineticTitle from '../components/landing/KineticTitle';
import SplitReveal from '../components/landing/SplitReveal';
import ScrollWords from '../components/landing/ScrollWords';
import TrackAnalyzer from '../components/landing/TrackAnalyzer';
import Marquee, { GenreChip, SignalChip } from '../components/landing/Marquee';
import StatsRow from '../components/landing/StatsRow';
import FeatureExplorer from '../components/landing/FeatureExplorer';
import PipelineSteps from '../components/landing/PipelineSteps';
import CassetteDeck from '../components/landing/CassetteDeck';
import OutputPanel from '../components/landing/OutputPanel';
import SpotlightCta from '../components/landing/SpotlightCta';
import { SAMPLE_TRACKS, GENRES, EASE, fadeUp, stagger, findTrack } from '../components/landing/data';

/**
 * The landing page. A still hero with one living element (the playhead),
 * then a page that moves because you scroll it: the content slides over the
 * hero as a curtain, the feature story pins its panel while the copy scrolls
 * past, the pipeline is scrubbed by scroll, and the archive pans sideways.
 * One piece of state, the selected sample track, runs through all of it.
 */

const TITLE_LINES = [
  { text: 'Decode' },
  { text: 'the DNA', shimmer: true },
  { text: 'of any song.' },
];

const STATEMENT =
  'Every recording carries a *signature.* Beatzy reads the *tempo,* the *key,* the *chords* and the *mood,* then hands you the numbers before the first chorus lands.';

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

function SectionIntro({ eyebrow, title, text, className = 'mx-auto max-w-5xl text-center' }) {
  return (
    <Reveal className={className}>
      <p className="text-[0.6875rem] font-semibold tracking-[0.36em] text-brand">{eyebrow}</p>
      <SplitReveal
        text={title}
        delay={0.15}
        className="mt-4 font-display text-[clamp(2.25rem,3.6vw,3.5rem)] font-semibold tracking-tight text-ink"
      />
      {text && <p className="mt-5 text-lg leading-8 text-ink-muted">{text}</p>}
    </Reveal>
  );
}

export default function Landing() {
  const { token } = useAuthStore();
  const [trackId, setTrackId] = useState(SAMPLE_TRACKS[0].id);
  const track = findTrack(trackId);

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroProgress, [0, 1], [0, 140]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const ringY = useTransform(heroProgress, [0, 1], [0, -80]);
  const ringScale = useTransform(heroProgress, [0, 1], [1, 0.86]);
  const ringOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const backdropY = useTransform(heroProgress, [0, 1], [0, 120]);

  const signals = useMemo(
    () => [
      { icon: Activity, label: 'BPM', value: track.bpm },
      { icon: Music2, label: 'Key', value: track.key },
      { icon: Sparkles, label: 'Mood', value: track.mood },
      { icon: Waves, label: 'Chords', value: track.chords.join(' · ') },
      { icon: Zap, label: 'Energy', value: track.energy.toFixed(2) },
      { icon: Disc3, label: 'Camelot', value: track.camelot },
      { icon: Fingerprint, label: 'Confidence', value: `${(track.confidence * 100).toFixed(2)}%` },
      { icon: Timer, label: 'Latency', value: `${track.latencyMs} ms` },
    ],
    [track],
  );

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="noise relative min-h-screen overflow-x-clip bg-transparent font-sans text-ink antialiased selection:bg-brand selection:text-brand-ink">
        <PublicNav />
        <ScrollProgress />
        <CursorRing />

        <main id="top" className="relative z-10">
          {/* ============ HERO ============ */}
          <section ref={heroRef} className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
            <motion.div className="absolute inset-0" style={{ y: backdropY }}>
              <LandingBackground />
            </motion.div>
            <div className="relative z-10 mx-auto grid w-full max-w-[1720px] items-center gap-16 px-5 pb-32 pt-24 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
              <motion.div
                className="max-w-5xl"
                style={{ y: heroY, opacity: heroOpacity }}
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                <motion.p variants={fadeUp} className="mb-8 flex items-center gap-3 text-[0.6875rem] font-medium tracking-[0.3em] text-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                  MUSIC INTELLIGENCE
                </motion.p>
                <KineticTitle
                  lines={TITLE_LINES}
                  className="max-w-7xl text-[clamp(3.25rem,8.4vw,7.5rem)] font-black uppercase leading-[0.92] tracking-[-0.05em] text-ink"
                />
                <motion.p variants={fadeUp} className="mt-8 max-w-xl text-lg leading-8 text-ink-muted sm:text-xl">
                  Upload a track. Get its tempo, key, chords and mood in seconds, with an API to match.
                </motion.p>
                <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-6">
                  <MagneticCta
                    to={token ? '/upload' : '/register'}
                    className="cta-3d btn-shine inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand px-8 text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink"
                  >
                    Start analyzing<ArrowUpRight className="ml-2 h-5 w-5" />
                  </MagneticCta>
                  <a
                    href="#features"
                    onClick={scrollTo('#features')}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    See how it works
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </a>
                </motion.div>
              </motion.div>

              <motion.div style={{ y: ringY, scale: ringScale, opacity: ringOpacity }}>
                <TrackAnalyzer trackId={trackId} onSelect={setTrackId} />
              </motion.div>
            </div>
          </section>

          {/* Everything below slides over the hero as a rounded curtain. */}
          <div className="relative z-20 -mt-10 overflow-clip rounded-t-[2.5rem] bg-canvas shadow-[0_-30px_80px_rgba(0,0,0,.28)] sm:rounded-t-[3rem]">
            {/* ============ GENRE TICKER ============ */}
            <Marquee label="Genres" items={GENRES} renderItem={(g) => <GenreChip label={g} />} className="border-t-0 bg-transparent pt-8" />

            {/* ============ STATS ============ */}
            <section aria-label="Platform statistics" className="relative py-14">
              <StatsRow />
            </section>

            {/* ============ STATEMENT ============ */}
            <section aria-label="What Beatzy does" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
              <ScrollWords
                text={STATEMENT}
                className="font-display text-[clamp(1.75rem,3.6vw,3.4rem)] font-semibold leading-[1.15] tracking-tight text-ink"
              />
            </section>

            {/* ============ FEATURES ============ */}
            <section id="features" className="relative mx-auto max-w-[1720px] px-5 py-24 sm:px-8 lg:px-10">
              <SectionIntro
                eyebrow="FEATURES"
                title="Everything a track can tell you."
                text="Scroll through the three capabilities. The panel keeps pace, and every panel is a working model you can use."
              />
              <FeatureExplorer track={track} />
            </section>

            {/* ============ HOW IT WORKS ============ */}
            <section id="how-it-works" className="relative overflow-x-clip border-y border-line bg-canvas/70 py-28">
              <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/[0.045] blur-[120px]" />
              <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8">
                <SectionIntro
                  eyebrow="PIPELINE"
                  title="How it works"
                  text="Three stages, a few seconds. Scroll to move a file through the engine."
                />
                <PipelineSteps track={track} />
              </div>
            </section>

            {/* ============ CASSETTE ARCHIVE ============ */}
            <section id="archive" className="relative">
              <CassetteDeck trackId={trackId} onSelect={setTrackId} />
            </section>

            {/* ============ EXAMPLES ============ */}
            <section id="examples" className="relative mx-auto grid max-w-[1720px] gap-10 px-5 py-28 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
              <Reveal>
                <p className="text-[0.6875rem] font-semibold tracking-[0.36em] text-brand">EXAMPLES</p>
                <SplitReveal
                  text="Clean output for developers."
                  delay={0.15}
                  className="mt-4 font-display text-[clamp(2.25rem,3.6vw,3.5rem)] font-semibold tracking-tight text-ink"
                />
                <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-muted">
                  Designed for developers who need a gorgeous dashboard and reliable machine-readable analysis. No guesswork. Just clean signal.
                </p>
                <p className="mt-6 text-sm text-ink-muted">
                  Showing <span className="font-medium text-ink">{track.title}</span>. Choose another tape above, or a track in the hero, and this panel follows.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <OutputPanel track={track} />
              </Reveal>
            </section>

            {/* ============ SIGNAL TICKER ============ */}
            <Marquee
              label="Analysis signals"
              items={signals}
              reverse
              baseVelocity={3}
              renderItem={(s) => <SignalChip icon={s.icon} label={s.label} value={s.value} />}
            />

            {/* ============ CTA BANNER ============ */}
            <section id="pricing" className="relative px-5 py-28 sm:px-8 lg:px-10">
              <Reveal>
                <SpotlightCta to={token ? '/upload' : '/pricing'} />
              </Reveal>
            </section>
          </div>
        </main>

        <div className="relative z-10"><PublicFooter /></div>
      </div>
    </MotionConfig>
  );
}
