import { useEffect, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui';
import useLazyChordSynth from './useLazyChordSynth';
import TiltCard from './TiltCard';
import HorizontalRail from './HorizontalRail';
import SplitReveal from './SplitReveal';
import { SAMPLE_TRACKS, EASE, fadeUp } from './data';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * Three tapes on a rail that pans sideways as the page scrolls (a vertical
 * stack on small screens). Press play and the reels turn, the counter runs
 * and the chord progression steps at the track's tempo; tap any chord to
 * hear it. Selecting a tape also selects the track for the rest of the page.
 */
function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function Reel({ spinning, speed, spoolSize }) {
  const rotate = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (!spinning) return;
    rotate.set((rotate.get() + (speed * Math.min(delta, 64)) / 1000) % 360);
  });
  return (
    <div className="relative flex items-center justify-center">
      <span className={cn('absolute rounded-full bg-ink/15', spoolSize)} />
      <motion.div
        style={{ rotate }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-line-strong bg-canvas"
      >
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-2.5 rounded-full bg-line-strong"
            style={{ transform: `rotate(${i * 60}deg) translateX(16px)` }}
          />
        ))}
        <span className="h-3 w-3 rounded-full bg-line-strong" />
      </motion.div>
    </div>
  );
}

function CassetteCard({ tape, index, selected, playing, soundOn, reduced, onSelect, onTogglePlay, onChord }) {
  const accentText = tape.accent === 'warm' ? 'text-accent-warm' : 'text-brand';
  const [elapsed, setElapsed] = useState(0);
  const [chordIdx, setChordIdx] = useState(0);
  const barMs = 240000 / tape.bpm;

  // the tape counter
  useEffect(() => {
    if (!playing) return undefined;
    const started = performance.now();
    const base = elapsed;
    const clock = setInterval(() => setElapsed(base + Math.floor((performance.now() - started) / 1000)), 250);
    return () => clearInterval(clock);
  }, [playing]);

  // step through the progression one bar at a time
  useEffect(() => {
    if (!playing) return undefined;
    const id = setTimeout(() => setChordIdx((i) => (i + 1) % tape.chords.length), barMs);
    return () => clearTimeout(id);
  }, [playing, chordIdx, barMs, tape.chords.length]);

  // and sound each chord when the deck's sound is on
  useEffect(() => {
    if (playing && soundOn) onChord(tape.chords[chordIdx], false);
  }, [playing, chordIdx, soundOn]);

  return (
    <TiltCard
      as="article"
      max={6}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={reduced ? undefined : { y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer rounded-[2rem] border bg-veil-1 p-5 backdrop-blur-xl transition-[border-color,box-shadow] duration-[var(--duration-slow)]',
        selected
          ? 'border-brand/50 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_25%,transparent),0_24px_80px_color-mix(in_oklab,var(--brand)_10%,transparent)]'
          : 'border-line hover:border-line-strong/60',
      )}
    >
      <div className="relative rounded-[1.4rem] border border-line-strong bg-raised/80 p-4">
        {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-2', 'right-2 bottom-2'].map((pos) => (
          <span key={pos} className={`absolute ${pos} h-1.5 w-1.5 rounded-full bg-line-strong`} aria-hidden="true" />
        ))}

        {/* Label */}
        <div className="rounded-xl border border-line bg-veil-2 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <p className={cn('text-[0.625rem] font-semibold tracking-[0.3em]', accentText)}>BZ-{String(index + 1).padStart(3, '0')}</p>
            {selected ? (
              <Badge variant="brand">Selected</Badge>
            ) : (
              <p className="text-[0.625rem] tracking-[0.3em] text-ink-muted">SIDE {tape.side}</p>
            )}
          </div>
          <h3 className="mt-2 truncate font-display text-2xl font-semibold tracking-tight text-ink">{tape.title}</h3>
          <p className="text-sm text-ink-muted">{tape.artist}</p>
          <div className="mt-3 flex flex-col gap-1" aria-hidden="true">
            <span className="h-1.5 rounded-full bg-brand" />
            <span className="h-1.5 rounded-full bg-accent-warm" />
          </div>
        </div>

        {/* Tape window */}
        <div className="mt-3 flex items-center rounded-xl border border-line-strong bg-canvas/80 px-5 py-3">
          <Reel spinning={playing && !reduced} speed={150} spoolSize="h-12 w-12" />
          <div className="mx-3 flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-ink/20">
              <motion.div
                className="h-full rounded-full bg-brand/70"
                initial={false}
                animate={{ width: `${((elapsed % 60) / 60) * 100}%` }}
                transition={{ duration: 0.25, ease: 'linear' }}
              />
            </div>
          </div>
          <Reel spinning={playing && !reduced} speed={230} spoolSize="h-8 w-8" />
        </div>

        {/* Transport */}
        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            aria-pressed={playing}
            aria-label={playing ? `Pause ${tape.title}` : `Play ${tape.title}`}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors',
              playing ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink hover:border-line-strong',
            )}
          >
            {playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <span className="font-mono text-xs tabular-nums text-ink-muted">{formatClock(elapsed)}</span>
          <span className="text-xs text-ink-muted">
            {tape.bpm} BPM · <span className={accentText}>{tape.keyShort}</span>
          </span>
        </div>

        {/* Chords */}
        <div className="mt-3 grid grid-cols-4 gap-1.5" role="group" aria-label={`Chords in ${tape.title}`}>
          {tape.chords.map((chord, i) => {
            const live = playing && i === chordIdx;
            return (
              <motion.button
                key={chord}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                  setChordIdx(i);
                  onChord(chord, true);
                }}
                aria-label={`Play ${chord} chord`}
                className={cn(
                  'relative h-9 rounded-lg border text-sm font-medium transition-colors',
                  live ? 'border-brand bg-brand/15 text-brand' : 'border-line bg-surface text-ink hover:border-line-strong',
                )}
              >
                {chord}
                {live && (
                  <motion.span
                    layoutId={`chord-live-${tape.id}`}
                    className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-brand"
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </TiltCard>
  );
}

export default function CassetteDeck({ trackId, onSelect }) {
  const [playing, setPlaying] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const { play } = useLazyChordSynth();
  const reduced = useReducedMotion();
  const token = useAuthStore((s) => s.token);

  const handleChord = (chord, fromUser) => {
    if (fromUser) {
      setSoundOn(true);
      play(chord);
    } else if (soundOn) {
      play(chord);
    }
  };

  return (
    <HorizontalRail stackClassName="mx-auto max-w-[1720px] px-5 py-20 sm:px-8">
      <div className="w-full shrink-0 lg:w-[38vw] lg:max-w-[34rem] lg:pr-8">
        <p className="text-[0.6875rem] font-semibold tracking-[0.36em] text-brand">THE ARCHIVE</p>
        <SplitReveal
          text="From any recording."
          delay={0.1}
          className="mt-4 font-display text-[clamp(2.25rem,3.6vw,3.5rem)] font-semibold tracking-tight text-ink"
        />
        <p className="mt-5 max-w-md text-lg leading-8 text-ink-muted">
          From dusty mixtapes to studio masters — feed Beatzy any recording and it reads the tempo, key, and mood pressed into the tape.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            aria-pressed={soundOn}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
              soundOn ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-surface text-ink-muted hover:text-ink',
            )}
          >
            {soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
          <p className="text-sm text-ink-muted">Press play to run a tape, or tap a chord to hear it.</p>
        </div>
      </div>

      {SAMPLE_TRACKS.map((tape, i) => (
        <div key={tape.id} className="w-full shrink-0 lg:w-[26rem]">
          <CassetteCard
            tape={tape}
            index={i}
            selected={tape.id === trackId}
            playing={playing === tape.id}
            soundOn={soundOn}
            reduced={reduced}
            onSelect={() => onSelect(tape.id)}
            onTogglePlay={() => {
              onSelect(tape.id);
              setPlaying((p) => (p === tape.id ? null : tape.id));
            }}
            onChord={handleChord}
          />
        </div>
      ))}

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="w-full shrink-0 lg:w-[22rem]"
      >
        <Link
          to={token ? '/upload' : '/register'}
          className="group flex h-full min-h-[18rem] flex-col justify-between rounded-[2rem] border border-dashed border-line-strong/60 bg-veil-1 p-7 transition-colors hover:border-brand/60"
        >
          <p className="text-[0.6875rem] font-semibold tracking-[0.3em] text-ink-muted">BZ-YOU</p>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink">Your recording here.</p>
            <p className="mt-2 text-sm text-ink-muted">Upload a track and read it the same way.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand">
              Analyze a track
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </Link>
      </motion.div>
    </HorizontalRail>
  );
}
