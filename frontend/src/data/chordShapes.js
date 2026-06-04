/**
 * Beatzy — Instrument Fingering Dictionary
 * Maps chord identifiers to visual fingering patterns for Guitar, Piano, and Ukulele.
 */

export const CHORD_SHAPES = {
  // --- MAJOR CHORDS ---
  "Cmaj": {
    guitar: { strings: "x32010", fingers: "032010" },
    piano: { keys: [0, 4, 7] }, // C, E, G
    ukulele: { strings: "0003", fingers: "0003" }
  },
  "C#maj": {
    guitar: { strings: "x43121", fingers: "043121" },
    piano: { keys: [1, 5, 8] },
    ukulele: { strings: "1114", fingers: "1114" }
  },
  "Dmaj": {
    guitar: { strings: "xx0232", fingers: "000132" },
    piano: { keys: [2, 6, 9] },
    ukulele: { strings: "2220", fingers: "1230" }
  },
  "D#maj": {
    guitar: { strings: "x65343", fingers: "043121" },
    piano: { keys: [3, 7, 10] },
    ukulele: { strings: "3331", fingers: "1111" }
  },
  "Emaj": {
    guitar: { strings: "022100", fingers: "023100" },
    piano: { keys: [4, 8, 11] },
    ukulele: { strings: "4442", fingers: "1111" }
  },
  "Fmaj": {
    guitar: { strings: "133211", fingers: "134211" },
    piano: { keys: [5, 9, 0] },
    ukulele: { strings: "2010", fingers: "2010" }
  },
  "F#maj": {
    guitar: { strings: "244322", fingers: "134211" },
    piano: { keys: [6, 10, 1] },
    ukulele: { strings: "3121", fingers: "3121" }
  },
  "Gmaj": {
    guitar: { strings: "320003", fingers: "320004" },
    piano: { keys: [7, 11, 2] },
    ukulele: { strings: "0232", fingers: "0132" }
  },
  "G#maj": {
    guitar: { strings: "466544", fingers: "134211" },
    piano: { keys: [8, 0, 3] },
    ukulele: { strings: "5343", fingers: "3121" }
  },
  "Amaj": {
    guitar: { strings: "x02220", fingers: "001230" },
    piano: { keys: [9, 1, 4] },
    ukulele: { strings: "2100", fingers: "2100" }
  },
  "A#maj": {
    guitar: { strings: "x13331", fingers: "012341" },
    piano: { keys: [10, 2, 5] },
    ukulele: { strings: "3211", fingers: "3211" }
  },
  "Bmaj": {
    guitar: { strings: "x24442", fingers: "012341" },
    piano: { keys: [11, 3, 6] },
    ukulele: { strings: "4322", fingers: "4311" }
  },

  // --- MINOR CHORDS ---
  "Cmin": {
    guitar: { strings: "x35543", fingers: "013421" },
    piano: { keys: [0, 3, 7] },
    ukulele: { strings: "0333", fingers: "0111" }
  },
  "C#min": {
    guitar: { strings: "x46654", fingers: "013421" },
    piano: { keys: [1, 4, 8] },
    ukulele: { strings: "1444", fingers: "1444" }
  },
  "Dmin": {
    guitar: { strings: "xx0231", fingers: "000231" },
    piano: { keys: [2, 5, 9] },
    ukulele: { strings: "2210", fingers: "2310" }
  },
  "D#min": {
    guitar: { strings: "x68876", fingers: "013421" },
    piano: { keys: [3, 6, 10] },
    ukulele: { strings: "3666", fingers: "1444" }
  },
  "Emin": {
    guitar: { strings: "022000", fingers: "023000" },
    piano: { keys: [4, 7, 11] },
    ukulele: { strings: "0432", fingers: "0432" }
  },
  "Fmin": {
    guitar: { strings: "133111", fingers: "134111" },
    piano: { keys: [5, 8, 0] },
    ukulele: { strings: "1013", fingers: "1024" }
  },
  "F#min": {
    guitar: { strings: "244222", fingers: "134111" },
    piano: { keys: [6, 9, 1] },
    ukulele: { strings: "2120", fingers: "2130" }
  },
  "Gmin": {
    guitar: { strings: "355333", fingers: "134111" },
    piano: { keys: [7, 10, 2] },
    ukulele: { strings: "0231", fingers: "0231" }
  },
  "G#min": {
    guitar: { strings: "466444", fingers: "134111" },
    piano: { keys: [8, 11, 3] },
    ukulele: { strings: "4342", fingers: "2131" }
  },
  "Amin": {
    guitar: { strings: "x02210", fingers: "002310" },
    piano: { keys: [9, 0, 4] },
    ukulele: { strings: "2000", fingers: "2000" }
  },
  "A#min": {
    guitar: { strings: "x13321", fingers: "013421" },
    piano: { keys: [10, 1, 5] },
    ukulele: { strings: "3111", fingers: "3111" }
  },
  "Bmin": {
    guitar: { strings: "x24432", fingers: "013421" },
    piano: { keys: [11, 2, 6] },
    ukulele: { strings: "4222", fingers: "3111" }
  }
};

/**
 * Normalizes a chord string (e.g., "F#min7") to its dictionary key.
 */
export function getChordShape(chordStr) {
  if (!chordStr || chordStr === "N.C.") return null;
  
  // Normalize quality names (e.g., "C#" + "min7" -> "C#min")
  // For now, we fall back to base maj/min if 7ths aren't in the dict
  const base = chordStr.replace(/7|sus4|maj7|min7/g, '');
  const shape = CHORD_SHAPES[chordStr] || CHORD_SHAPES[base];
  
  return shape || null;
}
