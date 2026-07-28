import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

const ROOT_SEMITONES = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

export function parseChordToNotes(chordName) {
  if (!chordName || typeof chordName !== 'string') {
    return ['C4', 'E4', 'G4'];
  }

  const cleanChord = chordName.trim();
  const regex = /^([A-G]#?)(min)?$/;
  const match = cleanChord.match(regex);

  let rootStr = 'C';
  let isMinor = false;

  if (match) {
    rootStr = match[1];
    isMinor = match[2] === 'min';
  } else {
    // Defensive fallback: extract root letter if possible
    const rootMatch = cleanChord.match(/^([A-G]#?)/);
    if (rootMatch) {
      rootStr = rootMatch[1];
    }
    // Check if contains 'min' or 'm' anywhere
    if (cleanChord.toLowerCase().includes('min') || (cleanChord.length > 1 && cleanChord.endsWith('m'))) {
      isMinor = true;
    }
  }

  const rootOffset = ROOT_SEMITONES[rootStr] ?? 0;
  const thirdOffset = isMinor ? 3 : 4;
  const fifthOffset = 7;

  // Base MIDI note for C4 is 60
  const rootMidi = 60 + rootOffset;
  const thirdMidi = 60 + rootOffset + thirdOffset;
  const fifthMidi = 60 + rootOffset + fifthOffset;

  return [
    Tone.Frequency(rootMidi, 'midi').toNote(),
    Tone.Frequency(thirdMidi, 'midi').toNote(),
    Tone.Frequency(fifthMidi, 'midi').toNote(),
  ];
}

export default function useChordSynth() {
  const synthRef = useRef(null);
  const reverbRef = useRef(null);
  const activeChordRef = useRef(null);

  useEffect(() => {
    // Instantiate Reverb & PolySynth
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 });
    const synth = new Tone.PolySynth(Tone.Synth, {
      volume: -6,
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.8,
        release: 0.8,
      },
    }).chain(reverb, Tone.Destination);

    reverbRef.current = reverb;
    synthRef.current = synth;

    return () => {
      try {
        synth.releaseAll();
        synth.dispose();
        reverb.dispose();
      } catch (err) {
        console.error('Error disposing synth:', err);
      }
    };
  }, []);

  const playChord = useCallback((chordName) => {
    if (!synthRef.current) return;
    if (activeChordRef.current === chordName) return;

    activeChordRef.current = chordName;
    synthRef.current.releaseAll();

    if (chordName) {
      const notes = parseChordToNotes(chordName);
      synthRef.current.triggerAttack(notes);
    }
  }, []);

  const stopChord = useCallback(() => {
    if (!synthRef.current) return;
    activeChordRef.current = null;
    synthRef.current.releaseAll();
  }, []);

  const setShimmer = useCallback((active) => {
    if (!reverbRef.current) return;
    const targetWet = active ? 0.6 : 0.25;
    try {
      reverbRef.current.wet.rampTo(targetWet, 0.3);
    } catch {
      reverbRef.current.wet.value = targetWet;
    }
  }, []);

  return {
    playChord,
    stopChord,
    setShimmer,
  };
}
