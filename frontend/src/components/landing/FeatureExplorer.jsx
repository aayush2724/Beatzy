import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Fingerprint, Radar, Code2, Copy, Check, RotateCcw, Send } from 'lucide-react';
import { Card, Tabs, Badge } from '../ui';
import AnimatedNumber from './AnimatedNumber';
import { EASE, DIMENSIONS, SAMPLE_TRACKS, seeded, findTrack } from './data';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * The features section as a scroll story: the three capabilities scroll past
 * on the left while a pinned panel on the right shows a working model of
 * whichever one is in view. Every panel is driven by the sample track chosen
 * elsewhere on the page, and each has its own controls.
 */
const FEATURES = [
  {
    id: 'fingerprint',
    icon: Fingerprint,
    title: 'Acoustic fingerprinting',
    text: 'Match noisy clips, live recordings, stems, and full tracks against a recognition layer built for sub-second lookup.',
    hint: 'Drag the clip quality slider to see how confidence holds up.',
  },
  {
    id: 'dimensions',
    icon: Radar,
    title: 'AI audio dimensions',
    text: 'Tempo, key, mood, energy, rhythm density, vocal presence, chords, sections, and similarity vectors for discovery systems.',
    hint: 'Hover an axis, or overlay a second track to compare.',
  },
  {
    id: 'api',
    icon: Code2,
    title: 'SaaS-ready API',
    text: 'Drop Beatzy into streaming apps, rights workflows, DJ tools, creator platforms, and catalog intelligence products.',
    hint: 'Send the request and watch the response come back.',
  },
];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/* --------------------------------------------------------- fingerprint -- */

const BINS = 36;
const FP_W = 360;
const FP_H = 130;

function FingerprintDemo({ track }) {
  const [quality, setQuality] = useState(0.72);
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();

  const { reference, clip, matched } = useMemo(() => {
    const ref = seeded(track.seed);
    const noise = seeded(track.seed + 101);
    const reference = Array.from({ length: BINS }, (_, i) => 18 + ref() * 60 + Math.sin(i / 3) * 14);
    const spread = 80 * (1 - quality) ** 1.2;
    const clip = reference.map((h) => Math.max(6, h + (noise() - 0.5) * 2 * spread));
    const matched = clip.map((h, i) => Math.abs(h - reference[i]) < 9);
    return { reference, clip, matched };
  }, [track.seed, quality]);

  const matchedCount = matched.filter(Boolean).length;
  const confidence = Math.max(60, 99.98 - (1 - quality) ** 1.5 * 16 - (BINS - matchedCount) * 0.15);
  const qualityLabel = quality < 0.35 ? 'Phone recording' : quality < 0.75 ? 'Live capture' : 'Studio master';
  const gap = 2;
  const barWidth = (FP_W - gap * (BINS - 1)) / BINS;

  return (
    <div className="flex h-full flex-col p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.28em] text-brand">MATCHING</p>
          <p className="mt-1 truncate font-display text-xl font-semibold text-ink">{track.title}</p>
          <p className="text-sm text-ink-muted">Clip spectrum against the reference</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-ink-muted">Confidence</p>
          <p className="font-display text-3xl font-semibold tracking-tight text-brand tabular-nums">
            <AnimatedNumber value={confidence} format={(v) => `${v.toFixed(2)}%`} duration={0.8} />
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${FP_W} ${FP_H}`} className="mt-6 w-full" aria-hidden="true">
        {reference.map((h, i) => (
          <rect
            key={`r${i}`}
            x={i * (barWidth + gap)}
            y={FP_H - h}
            width={barWidth}
            height={h}
            rx="1.5"
            fill="var(--line-strong)"
            opacity="0.35"
          />
        ))}
        <motion.g
          key={`${track.id}-${run}`}
          initial={reduced ? false : { x: 70, opacity: 0.4 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {clip.map((h, i) => (
            <motion.rect
              key={`c${i}`}
              x={i * (barWidth + gap)}
              width={barWidth}
              rx="1.5"
              className={cn('transition-[fill] duration-500', matched[i] ? 'fill-accent-warm' : 'fill-brand')}
              initial={false}
              animate={{ attrY: FP_H - h, height: h }}
              transition={{ duration: 0.45, ease: EASE, delay: i * 0.008 }}
            />
          ))}
        </motion.g>
      </svg>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="flex items-baseline justify-between text-xs text-ink-muted">
            <span>Clip quality</span>
            <span className="font-medium text-ink">{qualityLabel}</span>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="landing-range mt-2 w-full"
            aria-label="Clip quality"
          />
        </label>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-line-strong"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Re-run match
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="brand">{matchedCount} / {BINS} bins matched</Badge>
        <Badge variant="neutral">{track.latencyMs} ms lookup</Badge>
        <Badge variant="warm" dot>matched bin</Badge>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- dimensions -- */

const R_SIZE = 300;
const R_CX = 150;
const R_CY = 150;
const R_RAD = 105;
const angleAt = (i) => (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
const pointAt = (v, i, radius = R_RAD) => [R_CX + Math.cos(angleAt(i)) * radius * v, R_CY + Math.sin(angleAt(i)) * radius * v];
const polygonFor = (t) =>
  DIMENSIONS.map((d, i) => pointAt(clamp01(d.read(t)), i).map((n) => n.toFixed(1)).join(',')).join(' ');
const RINGS = [0.25, 0.5, 0.75, 1].map((s) => DIMENSIONS.map((_, i) => pointAt(s, i).map((n) => n.toFixed(1)).join(',')).join(' '));

function DimensionsDemo({ track }) {
  const [compareId, setCompareId] = useState('none');
  const [hover, setHover] = useState(null);
  const compare = compareId !== 'none' ? findTrack(compareId) : null;
  const others = SAMPLE_TRACKS.filter((t) => t.id !== track.id);
  const compareTabs = [{ id: 'none', label: 'None' }, ...others.map((t) => ({ id: t.id, label: t.title }))];
  const effectiveCompare = compare && compare.id !== track.id ? compare : null;

  return (
    <div className="grid h-full gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center">
      <svg
        viewBox={`0 0 ${R_SIZE} ${R_SIZE}`}
        className="mx-auto w-full max-w-[19rem]"
        role="img"
        aria-label={`Audio dimensions for ${track.title}`}
      >
        {RINGS.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="var(--line)" strokeWidth="1" />
        ))}
        {DIMENSIONS.map((d, i) => {
          const [x, y] = pointAt(1, i);
          const on = hover === d.id;
          return (
            <line
              key={d.id}
              x1={R_CX}
              y1={R_CY}
              x2={x}
              y2={y}
              stroke={on ? 'var(--brand)' : 'var(--line)'}
              strokeWidth={on ? 1.5 : 1}
            />
          );
        })}
        {effectiveCompare && (
          <motion.polygon
            key={effectiveCompare.id}
            points={polygonFor(effectiveCompare)}
            fill="var(--accent-warm)"
            fillOpacity="0.12"
            stroke="var(--accent-warm)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}
        <motion.polygon
          initial={false}
          animate={{ points: polygonFor(track) }}
          transition={{ duration: 0.7, ease: EASE }}
          fill="var(--brand)"
          fillOpacity="0.18"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {DIMENSIONS.map((d, i) => {
          const value = clamp01(d.read(track));
          const [x, y] = pointAt(value, i);
          const [lx, ly] = pointAt(1.2, i);
          const on = hover === d.id;
          return (
            <g
              key={d.id}
              onPointerEnter={() => setHover(d.id)}
              onPointerLeave={() => setHover(null)}
              className="cursor-default"
            >
              <motion.circle
                initial={false}
                animate={{ cx: x, cy: y, r: on ? 5.5 : 3.5 }}
                transition={{ duration: 0.5, ease: EASE }}
                fill="var(--brand)"
                stroke="var(--canvas)"
                strokeWidth="2"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight={on ? 600 : 500}
                fill={on ? 'var(--ink)' : 'var(--ink-muted)'}
                style={{ fontFamily: 'inherit' }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.28em] text-brand">SIX DIMENSIONS</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{track.title}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {DIMENSIONS.map((d) => {
            const value = clamp01(d.read(track));
            const other = effectiveCompare ? clamp01(d.read(effectiveCompare)) : null;
            const on = hover === d.id;
            return (
              <li
                key={d.id}
                onPointerEnter={() => setHover(d.id)}
                onPointerLeave={() => setHover(null)}
                className={cn('rounded-lg px-2 py-1 transition-colors', on && 'bg-veil-1')}
              >
                <div className="flex items-baseline justify-between text-xs">
                  <span className={cn('transition-colors', on ? 'text-ink' : 'text-ink-muted')}>{d.label}</span>
                  <span className="tabular-nums text-ink">
                    {Math.round(value * 100)}
                    {other !== null && <span className="ml-2 text-accent-warm">{Math.round(other * 100)}</span>}
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-veil-2">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={false}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.6, ease: EASE }}
                  />
                  {other !== null && (
                    <motion.span
                      className="absolute top-0 h-full w-0.5 bg-accent-warm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, left: `calc(${other * 100}% - 1px)` }}
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-5">
          <p className="mb-2 text-xs text-ink-muted">Compare with</p>
          <Tabs aria-label="Compare track" items={compareTabs} value={effectiveCompare ? effectiveCompare.id : 'none'} onChange={setCompareId} className="flex-wrap" />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- api -- */

const LANGS = [
  { id: 'curl', label: 'cURL' },
  { id: 'js', label: 'JavaScript' },
  { id: 'py', label: 'Python' },
];

function requestLines(lang, file) {
  switch (lang) {
    case 'js':
      return [
        `const form = new FormData();`,
        `form.append('audio', file); // ${file}`,
        ``,
        `const res = await fetch(\`\${BEATZY_URL}/api/audio/upload\`, {`,
        `  method: 'POST',`,
        `  headers: { 'X-API-Key': BEATZY_KEY },`,
        `  body: form,`,
        `});`,
        `const { jobId } = await res.json();`,
      ];
    case 'py':
      return [
        `import requests`,
        ``,
        `res = requests.post(`,
        `    f"{BEATZY_URL}/api/audio/upload",`,
        `    headers={"X-API-Key": BEATZY_KEY},`,
        `    files={"audio": open("${file}", "rb")},`,
        `)`,
        `job_id = res.json()["jobId"]`,
      ];
    default:
      return [
        `curl -X POST "$BEATZY_URL/api/audio/upload" \\`,
        `  -H "X-API-Key: $BEATZY_KEY" \\`,
        `  -F "audio=@${file}"`,
      ];
  }
}

function responseLines(track) {
  return [
    ['{', null],
    ['  "status": ', `"complete"`, 'str'],
    ['  "match": ', `"${track.title}"`, 'str'],
    ['  "confidence": ', String(track.confidence), 'num'],
    ['  "bpm": ', String(track.bpm), 'num'],
    ['  "key": ', `"${track.key}"`, 'str'],
    ['  "mood": ', `[${track.moods.map((m) => `"${m}"`).join(', ')}]`, 'str'],
    ['  "chords": ', `[${track.chords.map((c) => `"${c}"`).join(', ')}]`, 'str'],
    ['  "energy": ', String(track.energy), 'num'],
    ['}', null],
  ];
}

function ApiDemo({ track }) {
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | sending | done
  const [round, setRound] = useState(0);
  const timers = useRef([]);
  const file = `${slug(track.title)}.wav`;
  const request = requestLines(lang, file);
  const response = responseLines(track);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function send() {
    clearTimers();
    setPhase('sending');
    setRound((r) => r + 1);
    timers.current.push(setTimeout(() => setPhase('done'), 700));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(request.join('\n'));
      setCopied(true);
      timers.current.push(setTimeout(() => setCopied(false), 1600));
    } catch {
      /* clipboard blocked; nothing to do */
    }
  }

  const lineVariants = {
    hidden: { opacity: 0, x: -6 },
    show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } },
  };

  return (
    <div className="grid h-full lg:grid-cols-2">
      <div className="flex flex-col border-b border-line lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <Tabs aria-label="Request language" items={LANGS} value={lang} onChange={setLang} className="p-0.5" />
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:border-line-strong"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.pre
            key={lang}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-x-auto p-5 font-mono text-[0.8125rem] leading-6 text-ink-muted"
          >
            <code>
              {request.map((l, i) => (
                <span key={i} className="block">
                  {l || ' '}
                </span>
              ))}
            </code>
          </motion.pre>
        </AnimatePresence>
        <div className="border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={send}
            disabled={phase === 'sending'}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm !py-2.5 disabled:opacity-70"
          >
            <Send className="h-4 w-4" aria-hidden />
            {phase === 'sending' ? 'Sending…' : phase === 'done' ? 'Send again' : 'Send request'}
          </button>
        </div>
      </div>

      <div className="relative flex min-h-[18rem] flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-mono text-xs text-ink-muted">GET /api/results/job_8f3a</p>
          <AnimatePresence mode="wait" initial={false}>
            {phase === 'done' && (
              <motion.div key={round} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Badge variant="ok" dot>
                  200 · <AnimatedNumber value={track.latencyMs} duration={0.6} format={(v) => `${Math.round(v)} ms`} />
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative flex-1 p-5">
          {phase === 'idle' && (
            <p className="text-sm text-ink-faint">Send the request to see the analysis for {track.title}.</p>
          )}
          {phase === 'sending' && (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-veil-2">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              />
            </div>
          )}
          {phase === 'done' && (
            <motion.pre
              key={`${round}-${track.id}`}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="overflow-x-auto font-mono text-[0.8125rem] leading-6 text-ink-muted"
            >
              <code>
                {response.map(([k, v, type], i) => (
                  <motion.span key={i} variants={lineVariants} className="block">
                    <span className="text-ink">{k}</span>
                    {v !== null && <span className={type === 'num' ? 'text-accent-warm' : 'text-brand'}>{v}</span>}
                    {v !== null && i < response.length - 2 ? ',' : ''}
                  </motion.span>
                ))}
              </code>
            </motion.pre>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- story -- */

function StoryBlock({ feature, index, active, blockRef, onEnter }) {
  const inView = useInView(blockRef, { amount: 0.5, margin: '-12% 0px -12% 0px' });
  useEffect(() => {
    if (inView) onEnter();
  }, [inView, onEnter]);
  const Icon = feature.icon;
  return (
    <motion.div
      ref={blockRef}
      animate={{ opacity: active ? 1 : 0.3 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex min-h-[46vh] items-center py-8 lg:min-h-[72vh]"
    >
      <div>
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-[var(--duration-slow)]',
            active ? 'bg-brand text-brand-ink' : 'bg-veil-2 text-ink-muted',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-6 text-[0.6875rem] font-semibold tracking-[0.28em] text-brand">0{index + 1}</p>
        <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{feature.title}</h3>
        <p className="mt-4 max-w-md text-lg leading-8 text-ink-muted">{feature.text}</p>
        <p className="mt-3 text-sm text-ink-faint">{feature.hint}</p>
      </div>
    </motion.div>
  );
}

export default function FeatureExplorer({ track }) {
  const [active, setActive] = useState('fingerprint');
  const blockRefs = useRef(FEATURES.map(() => createRef()));
  const enter = useMemo(() => Object.fromEntries(FEATURES.map((f) => [f.id, () => setActive(f.id)])), []);
  const activeIndex = FEATURES.findIndex((f) => f.id === active);

  const jump = (i) => blockRefs.current[i].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-16">
      <div className="lg:order-2">
        <div className="sticky top-24 z-10">
          <Card id="feature-panel" padding="none" className="min-h-[24rem] overflow-hidden lg:min-h-[28rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.985 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="h-full"
              >
                {active === 'fingerprint' && <FingerprintDemo track={track} />}
                {active === 'dimensions' && <DimensionsDemo track={track} />}
                {active === 'api' && <ApiDemo track={track} />}
              </motion.div>
            </AnimatePresence>
          </Card>
          <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Features">
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={f.title}
                onClick={() => jump(i)}
                className="group flex h-6 items-center px-1"
              >
                <span
                  className={cn(
                    'block h-1 rounded-full transition-all duration-[var(--duration-slow)]',
                    i === activeIndex ? 'w-8 bg-brand' : 'w-3 bg-line-strong/60 group-hover:bg-line-strong',
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:order-1">
        {FEATURES.map((f, i) => (
          <StoryBlock
            key={f.id}
            feature={f}
            index={i}
            active={f.id === active}
            blockRef={blockRefs.current[i]}
            onEnter={enter[f.id]}
          />
        ))}
      </div>
    </div>
  );
}
