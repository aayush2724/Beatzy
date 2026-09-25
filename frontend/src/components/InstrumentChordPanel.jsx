import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { getChordShape } from '../data/chordShapes';
import { motion, AnimatePresence } from 'framer-motion';

const INSTRUMENTS = ['Guitar', 'Piano', 'Ukulele'];

const PIANO_NOTES = [
  { note: 0, label: 'C', black: false }, { note: 1, label: 'C#', black: true },
  { note: 2, label: 'D', black: false }, { note: 3, label: 'D#', black: true },
  { note: 4, label: 'E', black: false },
  { note: 5, label: 'F', black: false }, { note: 6, label: 'F#', black: true },
  { note: 7, label: 'G', black: false }, { note: 8, label: 'G#', black: true },
  { note: 9, label: 'A', black: false }, { note: 10, label: 'A#', black: true },
  { note: 11, label: 'B', black: false },
  { note: 12, label: 'C', black: false }
];

function Fretboard({ shape, strings }) {
  if (!shape) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-line px-6 text-center">
        <span className="text-sm text-ink-faint">No fingering available for this chord yet.</span>
      </div>
    );
  }

  const frets = shape.strings.split('').map(f => f === 'x' ? -1 : parseInt(f));
  const fingers = shape.fingers.split('').map(f => f === '0' ? '' : f);
  const fretCount = 5;

  return (
    <div className="relative p-4 bg-ink/[0.02] rounded-xl border border-glass-border">
      <svg viewBox="0 0 220 160" className="w-full h-48">
        {/* Strings */}
        {Array.from({ length: strings }).map((_, i) => (
          <line key={i} x1={20 + i * 36} y1={20} x2={20 + i * 36} y2={140} stroke="color-mix(in_oklab,var(--ink)_15%,transparent)" strokeWidth="1.5" />
        ))}
        {/* Frets */}
        {Array.from({ length: fretCount + 1 }).map((_, i) => (
          <line key={i} x1={20} y1={20 + i * 24} x2={20 + (strings - 1) * 36} y2={20 + i * 24} stroke={i === 0 ? "var(--color-primary)" : "color-mix(in_oklab,var(--ink)_10%,transparent)"} strokeWidth={i === 0 ? 3 : 1} />
        ))}
        
        {/* Markers */}
        {frets.map((fret, i) => {
          const x = 20 + i * 36;
          if (fret === -1) return <text key={i} x={x} y={15} textAnchor="middle" fill="color-mix(in_oklab,var(--ink)_30%,transparent)" fontSize="10" fontWeight="bold">✕</text>;
          if (fret === 0) return <circle key={i} cx={x} cy={12} r={4} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />;
          
          const y = 20 + (fret - 0.5) * 24;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={10} fill="var(--color-primary)" />
              <text x={x} y={y + 3.5} textAnchor="middle" fill="var(--brand-ink)" fontSize="9" fontWeight="800">{fingers[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PianoView({ keys }) {
  return (
    <div className="relative h-48 bg-ink/[0.02] rounded-xl border border-glass-border p-4 flex items-end justify-center overflow-hidden">
        <div className="flex h-32 w-full max-w-xs relative">
            {PIANO_NOTES.filter(n => !n.black).map((note, i) => {
                const active = keys.includes(note.note % 12);
                return (
                    <div key={i} className={clsx(
                        "flex-1 border-x border-canvas/40 rounded-b-sm transition-all duration-300",
                        active ? "bg-primary shadow-[0_0_15px_color-mix(in_oklab,var(--ink)_30%,transparent)] z-10" : "bg-ink/90"
                    )}>
                        <span className="absolute bottom-1 w-full text-center text-[9px] text-canvas/40 font-bold">{note.label}</span>
                    </div>
                );
            })}
            {/* Black keys overlay */}
            <div className="absolute inset-0 flex pointer-events-none">
                {/* Simplified black key positions */}
                {[1, 3, 6, 8, 10].map((noteIdx) => {
                    const active = keys.includes(noteIdx);
                    const leftPos = noteIdx <= 3 ? (noteIdx * 14) : (noteIdx * 14.5);
                    return (
                        <div key={noteIdx} className={clsx(
                            "absolute top-0 w-[12%] h-20 rounded-b-sm border border-canvas transition-all duration-300",
                            active ? "bg-secondary shadow-[0_0_15px_color-mix(in_oklab,var(--ink)_30%,transparent)] z-20" : "bg-canvas"
                        )} style={{ left: `${leftPos}%` }} />
                    );
                })}
            </div>
        </div>
    </div>
  );
}

export default function InstrumentChordPanel({ chords = [] }) {
  const [instrument, setInstrument] = useState('Guitar');
  const uniqueChords = useMemo(() => {
    const names = chords.map(c => c.chord).filter(n => n !== 'N.C.');
    return [...new Set(names)].slice(0, 10);
  }, [chords]);

  const [selectedChord, setSelectedChord] = useState(uniqueChords[0] || 'Cmaj');
  const shape = getChordShape(selectedChord);

  return (
    <section className="relative">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-ink-muted">Pick a chord to see how to play it.</p>
        <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Instrument">
          {INSTRUMENTS.map(ins => (
            <button
              key={ins}
              role="tab"
              aria-selected={instrument === ins}
              onClick={() => setInstrument(ins)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                instrument === ins ? 'bg-raised text-ink shadow-[var(--shadow-sm)]' : 'text-ink-muted hover:text-ink'
              )}
            >
              {ins}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-12 lg:col-span-4">
            <div className="space-y-4">
                <p className="text-xs font-medium text-ink-muted">{uniqueChords.length ? 'Chords in this track' : 'Example chords'}</p>
                <div className="flex flex-wrap gap-2">
                    {(uniqueChords.length > 0 ? uniqueChords : ['Cmaj', 'Gmaj', 'Amin', 'Fmaj']).map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedChord(c)}
                            className={clsx(
                                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                                selectedChord === c ? 'border-brand/50 bg-brand/10 text-brand' : 'border-line bg-surface text-ink-muted hover:border-line-strong/60 hover:text-ink'
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <div className="border-t border-line-subtle pt-4">
                    <div className="font-display text-3xl font-semibold tracking-tight text-ink">{selectedChord}</div>
                    <p className="mt-1 text-xs text-ink-faint">{instrument} fingering</p>
                </div>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${instrument}-${selectedChord}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {instrument === 'Piano' ? (
                        <PianoView keys={shape?.piano?.keys || []} />
                    ) : (
                        <Fretboard 
                            shape={instrument === 'Guitar' ? shape?.guitar : shape?.ukulele} 
                            strings={instrument === 'Guitar' ? 6 : 4} 
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
