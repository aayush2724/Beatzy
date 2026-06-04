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
      <div className="h-48 rounded-lg border border-dashed border-glass-border flex items-center justify-center px-6 text-center bg-white/[0.01]">
        <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
          Shape data not synchronized
        </span>
      </div>
    );
  }

  const frets = shape.strings.split('').map(f => f === 'x' ? -1 : parseInt(f));
  const fingers = shape.fingers.split('').map(f => f === '0' ? '' : f);
  const fretCount = 5;

  return (
    <div className="relative p-4 bg-white/[0.02] rounded-xl border border-glass-border">
      <svg viewBox="0 0 220 160" className="w-full h-48">
        {/* Strings */}
        {Array.from({ length: strings }).map((_, i) => (
          <line key={i} x1={20 + i * 36} y1={20} x2={20 + i * 36} y2={140} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        ))}
        {/* Frets */}
        {Array.from({ length: fretCount + 1 }).map((_, i) => (
          <line key={i} x1={20} y1={20 + i * 24} x2={20 + (strings - 1) * 36} y2={20 + i * 24} stroke={i === 0 ? "var(--color-primary)" : "rgba(255,255,255,0.1)"} strokeWidth={i === 0 ? 3 : 1} />
        ))}
        
        {/* Markers */}
        {frets.map((fret, i) => {
          const x = 20 + i * 36;
          if (fret === -1) return <text key={i} x={x} y={15} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="bold">✕</text>;
          if (fret === 0) return <circle key={i} cx={x} cy={12} r={4} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />;
          
          const y = 20 + (fret - 0.5) * 24;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={10} fill="var(--color-primary)" />
              <text x={x} y={y + 3.5} textAnchor="middle" fill="#000" fontSize="9" fontWeight="800">{fingers[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PianoView({ keys }) {
  return (
    <div className="relative h-48 bg-white/[0.02] rounded-xl border border-glass-border p-4 flex items-end justify-center overflow-hidden">
        <div className="flex h-32 w-full max-w-xs relative">
            {PIANO_NOTES.filter(n => !n.black).map((note, i) => {
                const active = keys.includes(note.note % 12);
                return (
                    <div key={i} className={clsx(
                        "flex-1 border-x border-black/40 rounded-b-sm transition-all duration-300",
                        active ? "bg-primary shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10" : "bg-white/90"
                    )}>
                        <span className="absolute bottom-1 w-full text-center text-[7px] text-black/40 font-bold">{note.label}</span>
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
                            "absolute top-0 w-[12%] h-20 rounded-b-sm border border-black transition-all duration-300",
                            active ? "bg-secondary shadow-[0_0_15px_rgba(255,255,255,0.3)] z-20" : "bg-black"
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
    <section className="glass-panel border border-glass-border p-6 rounded-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-8xl">piano</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <h3 className="font-headline font-bold text-sm text-primary uppercase tracking-widest">Musician Assist</h3>
          <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Dynamic fingering guide</span>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          {INSTRUMENTS.map(ins => (
            <button
              key={ins}
              onClick={() => setInstrument(ins)}
              className={clsx(
                "px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all",
                instrument === ins ? "bg-primary text-surface font-bold" : "text-on-surface-variant hover:text-white"
              )}
            >
              {ins}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start relative z-10">
        <div className="col-span-12 lg:col-span-4">
            <div className="space-y-4">
                <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">Detected Signals</p>
                <div className="flex flex-wrap gap-2">
                    {(uniqueChords.length > 0 ? uniqueChords : ['Cmaj', 'Gmaj', 'Amin', 'Fmaj']).map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedChord(c)}
                            className={clsx(
                                "px-3 py-2 rounded-lg border font-mono text-[11px] font-bold transition-all",
                                selectedChord === c ? "border-primary bg-primary/10 text-primary" : "border-glass-border bg-white/[0.02] text-on-surface-variant hover:border-white/20"
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <div className="pt-4 border-t border-glass-border">
                    <div className="text-4xl font-headline font-extrabold text-white mb-2">{selectedChord}</div>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed font-mono uppercase opacity-60">
                        {instrument} Tablature Mode
                    </p>
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
