import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { Card, Tabs, Badge } from '../ui';
import { EASE } from './data';
import TiltCard from './TiltCard';
import { cn } from '../../lib/utils';

/**
 * The developer output for whichever sample track is selected. Switch between
 * the JSON response and the cURL that produces it; copy either.
 */
const VIEWS = [
  { id: 'json', label: 'Response' },
  { id: 'curl', label: 'cURL' },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function payloadFor(track) {
  return {
    track_id: `btz_${track.seed}0${track.bpm}x`,
    status: 'complete',
    match: track.title,
    artist: track.artist,
    confidence: track.confidence,
    bpm: track.bpm,
    key: track.key,
    camelot: track.camelot,
    mood: track.moods,
    chords: track.chords,
    energy: track.energy,
    danceability: track.danceability,
    api_latency_ms: track.latencyMs,
  };
}

function curlFor(track) {
  return [
    `curl -X POST "$BEATZY_URL/api/audio/upload" \\`,
    `  -H "X-API-Key: $BEATZY_KEY" \\`,
    `  -F "audio=@${slug(track.title)}.wav"`,
    ``,
    `# { "jobId": "job_8f3a", "status": "processing" }`,
    ``,
    `curl "$BEATZY_URL/api/results/job_8f3a" \\`,
    `  -H "X-API-Key: $BEATZY_KEY"`,
  ];
}

function Value({ value }) {
  if (typeof value === 'number') return <span className="text-accent-warm">{value}</span>;
  if (typeof value === 'string') return <span className="text-brand">"{value}"</span>;
  if (Array.isArray(value)) {
    return (
      <>
        [
        {value.map((v, i) => (
          <span key={i}>
            <span className="text-brand">"{v}"</span>
            {i < value.length - 1 ? ', ' : ''}
          </span>
        ))}
        ]
      </>
    );
  }
  return <span>{String(value)}</span>;
}

const list = { show: { transition: { staggerChildren: 0.035 } } };
const line = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
};

export default function OutputPanel({ track }) {
  const [view, setView] = useState('json');
  const [copied, setCopied] = useState(false);
  const data = useMemo(() => payloadFor(track), [track]);
  const entries = useMemo(() => Object.entries(data), [data]);
  const curl = useMemo(() => curlFor(track), [track]);
  const raw = view === 'json' ? JSON.stringify(data, null, 2) : curl.join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; nothing to do */
    }
  }

  return (
    <TiltCard max={4}>
    <Card padding="none" className="overflow-hidden shadow-[var(--shadow-md)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-veil-1 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-line-strong" />
            <span className="h-3 w-3 rounded-full bg-accent-warm" />
            <span className="h-3 w-3 rounded-full bg-brand" />
          </div>
          <p className="truncate font-mono text-xs text-ink-muted">{slug(track.title)}.analysis.json</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs aria-label="Output view" items={VIEWS} value={view} onChange={setView} className="p-0.5" />
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:border-line-strong"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="relative min-h-[22rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.pre
            key={`${view}-${track.id}`}
            variants={list}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-x-auto p-6 font-mono text-sm leading-7 text-ink-muted"
          >
            {view === 'json' ? (
              <code>
                <motion.span variants={line} className="block">{'{'}</motion.span>
                {entries.map(([k, v], i) => (
                  <motion.span key={k} variants={line} className="block pl-4">
                    <span className="text-ink">"{k}"</span>: <Value value={v} />
                    {i < entries.length - 1 ? ',' : ''}
                  </motion.span>
                ))}
                <motion.span variants={line} className="block">{'}'}</motion.span>
              </code>
            ) : (
              <code>
                {curl.map((l, i) => (
                  <motion.span key={i} variants={line} className={cn('block', l.startsWith('#') && 'text-ink-faint')}>
                    {l || ' '}
                  </motion.span>
                ))}
              </code>
            )}
          </motion.pre>
        </AnimatePresence>
        <div className="pointer-events-none absolute bottom-4 right-4">
          <Badge variant="neutral">{track.latencyMs} ms</Badge>
        </div>
      </div>
    </Card>
    </TiltCard>
  );
}
