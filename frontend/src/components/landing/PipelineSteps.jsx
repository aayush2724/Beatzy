import { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { FileAudio, Waves, Sparkles, Check } from 'lucide-react';
import { Card, Badge } from '../ui';
import { EASE } from './data';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * "How it works" as a scroll-scrubbed stepper. On large screens the stepper
 * pins to the viewport while the section scrolls beneath it: the rail fills
 * with scroll position and each third of the distance plays one stage.
 * Clicking a step scrolls to it. On smaller screens it is a plain stepper.
 */
const STEPS = [
  {
    id: 'upload',
    icon: FileAudio,
    title: 'Upload',
    text: 'Drop MP3, WAV, FLAC, stems, or short captured snippets into the engine.',
    points: ['Drag and drop, or record from the mic', 'Batch uploads and catalog URLs', 'Files are queued the moment they land'],
  },
  {
    id: 'analyze',
    icon: Waves,
    title: 'Analyze',
    text: 'Fingerprinting, source separation, chord inference, tempo grids, and mood models run together.',
    points: ['Five engines run in parallel', 'Progress streams back over a socket', 'Most tracks finish in under three seconds'],
  },
  {
    id: 'reveal',
    icon: Sparkles,
    title: 'Reveal',
    text: 'Return clean metadata, confidence scores, and structured JSON for product teams.',
    points: ['A dashboard report and a share link', 'Machine-readable JSON with confidences', 'Export it, or fetch it from the API'],
  },
];

const scene = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.4, ease: EASE },
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function UploadScene({ track }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="rounded-2xl border border-dashed border-line-strong/70 bg-canvas/40 p-4">
        <p className="text-center text-xs text-ink-faint">Drop audio here</p>
        <motion.div
          initial={{ y: -56, opacity: 0, rotate: -3 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-sm)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FileAudio className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{slug(track.title)}.wav</p>
            <p className="text-xs text-ink-muted">{track.sizeMb.toFixed(1)} MB · 44.1 kHz</p>
          </div>
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, duration: 0.3, ease: EASE }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-ink"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
          </motion.span>
        </motion.div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-veil-2">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.5 }}
          />
        </div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className="flex flex-wrap gap-2">
        <Badge variant="brand" dot>Queued</Badge>
        <Badge variant="neutral">job_8f3a</Badge>
      </motion.div>
    </div>
  );
}

const ENGINES = [
  ['Fingerprint', 0.9],
  ['Tempo grid', 1.3],
  ['Key and chords', 1.7],
  ['Source separation', 2.1],
  ['Mood model', 1.5],
];

function AnalyzeScene() {
  return (
    <div className="flex h-full flex-col justify-center gap-3.5">
      {ENGINES.map(([name, duration], i) => (
        <div key={name} className="flex items-center gap-3">
          <p className="w-32 shrink-0 text-xs text-ink-muted">{name}</p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-veil-2">
            <motion.div
              className={cn('h-full rounded-full', i % 2 ? 'bg-accent-warm' : 'bg-brand')}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration, ease: [0.4, 0, 0.2, 1], delay: 0.1 + i * 0.12 }}
            />
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.12 + duration }}
            className="w-10 text-right text-xs text-ink"
          >
            done
          </motion.span>
        </div>
      ))}
    </div>
  );
}

function RevealScene({ track }) {
  const chips = [
    [`${track.bpm} BPM`, 'brand'],
    [track.key, 'brand'],
    [track.mood, 'warm'],
    [track.chords.join(' · '), 'neutral'],
    [`${(track.confidence * 100).toFixed(2)}% match`, 'brand'],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
        className="flex flex-wrap gap-2"
      >
        {chips.map(([label, variant]) => (
          <motion.span
            key={label}
            variants={{
              hidden: { opacity: 0, scale: 0.8, y: 8 },
              show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
            }}
          >
            <Badge variant={variant} className="px-3 py-1 text-xs">{label}</Badge>
          </motion.span>
        ))}
      </motion.div>
      <motion.pre
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
        className="overflow-x-auto rounded-xl border border-line bg-canvas/60 p-4 font-mono text-xs leading-6 text-ink-muted"
      >
        {`{ "status": "complete", "bpm": ${track.bpm}, "key": "${track.key}",\n  "mood": ["${track.moods.join('", "')}"], "confidence": ${track.confidence} }`}
      </motion.pre>
    </div>
  );
}

export default function PipelineSteps({ track }) {
  const ref = useRef(null);
  const pinned = useMediaQuery('(min-width: 1024px)');
  const reduced = useReducedMotion();
  const [manual, setManual] = useState(0);
  const [scrubbed, setScrubbed] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setScrubbed(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length))));
  });
  const railFill = useSpring(useTransform(scrollYProgress, [0.06, 0.94], [0, 1]), { stiffness: 120, damping: 24 });

  const index = pinned ? scrubbed : manual;
  const step = STEPS[index];

  const select = (i) => {
    if (!pinned) {
      setManual(i);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.5) / STEPS.length), behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div ref={ref} className="mt-16 lg:h-[280vh]">
      <div className="lg:sticky lg:top-24">
        <div className="relative">
          <div aria-hidden="true" className="absolute left-[16.66%] right-[16.66%] top-9 hidden h-px bg-line md:block">
            {pinned ? (
              <motion.div className="h-full origin-left bg-brand" style={{ scaleX: railFill }} />
            ) : (
              <motion.div
                className="h-full origin-left bg-brand"
                initial={false}
                animate={{ scaleX: index / (STEPS.length - 1) }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            )}
          </div>
          <div role="tablist" aria-label="Pipeline steps" className="relative grid grid-cols-3 gap-2 md:gap-4">
            {STEPS.map((s, i) => {
              const state = i === index ? 'active' : i < index ? 'done' : 'todo';
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-controls="pipeline-panel"
                  onClick={() => select(i)}
                  className="group flex flex-col items-center gap-3 rounded-2xl p-2 text-center"
                >
                  <span
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl border text-lg font-semibold transition-[color,border-color,background-color,transform] duration-[var(--duration-slow)] group-hover:scale-110',
                      state === 'active' && 'border-brand bg-brand text-brand-ink shadow-[0_0_32px_color-mix(in_oklab,var(--brand)_24%,transparent)]',
                      state === 'done' && 'border-brand/40 bg-brand/10 text-brand',
                      state === 'todo' && 'border-line bg-surface text-ink-muted group-hover:border-line-strong group-hover:text-ink',
                    )}
                  >
                    {state === 'done' ? <Check className="h-5 w-5" aria-hidden /> : `0${i + 1}`}
                  </span>
                  <span
                    className={cn(
                      'font-display text-base font-semibold tracking-tight transition-colors sm:text-lg',
                      i === index ? 'text-ink' : 'text-ink-muted group-hover:text-ink',
                    )}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Card id="pipeline-panel" role="tabpanel" padding="none" className="mt-10 overflow-hidden">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            <div className="p-7 sm:p-9">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step.id} {...scene}>
                  <p className="text-[0.6875rem] font-semibold tracking-[0.28em] text-brand">STEP 0{index + 1}</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{step.title}</h3>
                  <p className="mt-4 leading-7 text-ink-muted">{step.text}</p>
                  <ul className="mt-6 space-y-2.5">
                    {step.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-ink-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="relative min-h-[18rem] overflow-hidden border-t border-line bg-veil-1 p-7 sm:p-9 lg:border-l lg:border-t-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step.id} {...scene} className="h-full">
                  {step.id === 'upload' && <UploadScene track={track} />}
                  {step.id === 'analyze' && <AnalyzeScene />}
                  {step.id === 'reveal' && <RevealScene track={track} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-faint">
          {pinned ? 'Keep scrolling to move through the pipeline, or click a step.' : 'Tap a step to see it.'}
        </p>
      </div>
    </div>
  );
}
