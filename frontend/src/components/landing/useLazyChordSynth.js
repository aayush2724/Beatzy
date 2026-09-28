import { useCallback, useEffect, useRef } from 'react';

/**
 * A chord player for the cassette deck that only downloads Tone.js the first
 * time someone taps a chord. Landing visitors who never touch it pay nothing.
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ROOTS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function chordToNotes(name) {
  const match = /^([A-G])([#b]?)(m|min)?/.exec(String(name).trim());
  if (!match) return ['C4', 'E4', 'G4'];
  let root = ROOTS[match[1]];
  if (match[2] === '#') root += 1;
  if (match[2] === 'b') root -= 1;
  const minor = Boolean(match[3]);
  const midi = [60 + root, 60 + root + (minor ? 3 : 4), 60 + root + 7, 72 + root];
  return midi.map((m) => `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`);
}

export default function useLazyChordSynth() {
  const engine = useRef(null);
  const loading = useRef(null);

  useEffect(
    () => () => {
      try {
        engine.current?.synth.dispose();
        engine.current?.reverb.dispose();
      } catch {
        /* already disposed */
      }
    },
    [],
  );

  const ensure = useCallback(() => {
    if (engine.current) return Promise.resolve(engine.current);
    if (!loading.current) {
      loading.current = import('tone').then(async (Tone) => {
        await Tone.start();
        const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.25 });
        const synth = new Tone.PolySynth(Tone.Synth, {
          volume: -9,
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.25, sustain: 0.35, release: 1.2 },
        }).chain(reverb, Tone.getDestination());
        engine.current = { Tone, synth, reverb };
        return engine.current;
      });
    }
    return loading.current;
  }, []);

  const play = useCallback(
    async (chord) => {
      try {
        const { synth } = await ensure();
        synth.releaseAll();
        synth.triggerAttackRelease(chordToNotes(chord), '2n');
      } catch (err) {
        console.warn('Chord playback unavailable:', err);
      }
    },
    [ensure],
  );

  return { play };
}
