/**
 * Shared data and motion presets for the landing page.
 *
 * Every animated number on the page is derived from SAMPLE_TRACKS so the hero,
 * the feature explorer, the cassette deck and the output panel all describe
 * the same three recordings. Pick one anywhere and the rest follow.
 */

export const EASE = [0.16, 1, 0.3, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export const titleLine = {
  hidden: { opacity: 0, y: 46, rotateX: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
};

export const GENRES = [
  'Techno', 'Jazz', 'Lo-fi', 'Drum & bass', 'Soul', 'House',
  'Ambient', 'Hip-hop', 'Classical', 'Funk', 'Garage', 'Disco',
];

export const SAMPLE_TRACKS = [
  {
    id: 'midnight-signal',
    title: 'Midnight Signal',
    artist: 'Neon Drift',
    bpm: 128,
    key: 'F# minor',
    keyShort: 'F#m',
    camelot: '11A',
    mood: 'Electric',
    moods: ['electric', 'focused'],
    side: 'A',
    accent: 'brand',
    energy: 0.92,
    danceability: 0.88,
    valence: 0.61,
    acousticness: 0.08,
    vocal: 0.35,
    keyConfidence: 0.84,
    chordsFound: 12,
    confidence: 0.9998,
    chords: ['F#m', 'D', 'A', 'E'],
    genre: 'techno',
    latencyMs: 184,
    sizeMb: 4.2,
    seed: 3,
    duration: 228,
    sections: [['Intro', 0, 0.35], ['Verse', 0.1, 0.62], ['Chorus', 0.34, 0.96], ['Verse', 0.52, 0.66], ['Chorus', 0.7, 1], ['Outro', 0.9, 0.42]],
  },
  {
    id: 'glass-horizon',
    title: 'Glass Horizon',
    artist: 'Vela',
    bpm: 96,
    key: 'D minor',
    keyShort: 'Dm',
    camelot: '7A',
    mood: 'Moody',
    moods: ['moody', 'intimate'],
    side: 'B',
    accent: 'warm',
    energy: 0.48,
    danceability: 0.55,
    valence: 0.32,
    acousticness: 0.62,
    vocal: 0.71,
    keyConfidence: 0.77,
    chordsFound: 9,
    confidence: 0.9971,
    chords: ['Dm', 'Bb', 'F', 'C'],
    genre: 'ambient',
    latencyMs: 212,
    sizeMb: 7.8,
    seed: 7,
    duration: 251,
    sections: [['Intro', 0, 0.28], ['Verse', 0.14, 0.5], ['Chorus', 0.4, 0.78], ['Bridge', 0.58, 0.44], ['Chorus', 0.72, 0.84], ['Outro', 0.9, 0.3]],
  },
  {
    id: 'chrome-tide',
    title: 'Chrome Tide',
    artist: 'Analog Youth',
    bpm: 117,
    key: 'A minor',
    keyShort: 'Am',
    camelot: '8A',
    mood: 'Dreamy',
    moods: ['dreamy', 'warm'],
    side: 'A',
    accent: 'brand',
    energy: 0.7,
    danceability: 0.74,
    valence: 0.58,
    acousticness: 0.27,
    vocal: 0.52,
    keyConfidence: 0.9,
    chordsFound: 14,
    confidence: 0.9989,
    chords: ['Am', 'F', 'C', 'G'],
    genre: 'house',
    latencyMs: 176,
    sizeMb: 5.1,
    seed: 11,
    duration: 199,
    sections: [['Intro', 0, 0.4], ['Verse', 0.12, 0.66], ['Chorus', 0.36, 0.9], ['Verse', 0.54, 0.68], ['Chorus', 0.74, 0.94], ['Outro', 0.92, 0.36]],
  },
];

export function findTrack(id) {
  return SAMPLE_TRACKS.find((t) => t.id === id) ?? SAMPLE_TRACKS[0];
}

/** Six normalised axes for the radar chart, in drawing order. */
export const DIMENSIONS = [
  { id: 'tempo', label: 'Tempo', read: (t) => (t.bpm - 60) / 120 },
  { id: 'energy', label: 'Energy', read: (t) => t.energy },
  { id: 'danceability', label: 'Dance', read: (t) => t.danceability },
  { id: 'valence', label: 'Valence', read: (t) => t.valence },
  { id: 'acousticness', label: 'Acoustic', read: (t) => t.acousticness },
  { id: 'vocal', label: 'Vocal', read: (t) => t.vocal },
];

/**
 * A tiny seeded generator so "random-looking" bars are identical on every
 * render and every visit. No Math.random anywhere on the landing page.
 */
export function seeded(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
