/**
 * Resolved palette values for contexts that cannot read CSS custom properties.
 *
 * Everything in the app should style through the tokens in `index.css`. Three
 * things can't: WebGL materials (THREE.Color parses a real colour, not a
 * `var()`), canvas 2D fill styles, and SVG chart props from Recharts. Those
 * import from here so there is still a single source of truth.
 *
 * Values are read live off the document so they follow the active theme —
 * `readPalette()` re-reads on demand, `usePalette()` re-reads when it changes.
 */
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/** Used before the stylesheet resolves, and anywhere there is no document. */
const FALLBACK = {
  dark: {
    canvas: '#0B0711', surface: '#150E1F', raised: '#211730',
    line: '#292039', lineStrong: '#6E5F87',
    ink: '#F6F1FB', inkMuted: '#B0A3C4',
    brand: '#FF7A3D', brandDeep: '#E85A3A', brandInk: '#1B0A02',
    accentWarm: '#FFC97A',
    ramp: ['#B02A5B', '#E85A3A', '#FF9A45', '#FFC97A', '#FFE9C2'],
    ok: '#5FD196', warn: '#FFC24B', danger: '#FF8A8A',
  },
  light: {
    canvas: '#FCFAFF', surface: '#F3EEF9', raised: '#E7DFF2',
    line: '#E2DAEF', lineStrong: '#8F82A6',
    ink: '#15101E', inkMuted: '#59506B',
    brand: '#B3410B', brandDeep: '#CE4527', brandInk: '#FFFFFF',
    accentWarm: '#9E5A12',
    ramp: ['#3D1A5C', '#7A2270', '#A82655', '#CE4527', '#9E5A12'],
    ok: '#1A6B41', warn: '#8A5A00', danger: '#A81F27',
  },
};

const VARS = {
  canvas: '--canvas', surface: '--surface', raised: '--raised',
  line: '--line', lineStrong: '--line-strong',
  ink: '--ink', inkMuted: '--ink-muted',
  brand: '--brand', brandDeep: '--brand-deep', brandInk: '--brand-ink',
  accentWarm: '--accent-warm',
  ok: '--ok', warn: '--warn', danger: '--danger',
};

function currentTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Read the live palette off the document, falling back to the constants above. */
export function readPalette() {
  const fallback = FALLBACK[currentTheme()];
  if (typeof window === 'undefined' || !window.getComputedStyle) return fallback;

  const style = window.getComputedStyle(document.documentElement);
  const read = (name, fb) => style.getPropertyValue(name).trim() || fb;

  const out = {};
  for (const [key, cssVar] of Object.entries(VARS)) out[key] = read(cssVar, fallback[key]);
  out.ramp = fallback.ramp.map((fb, i) => read(`--ramp-${i + 1}`, fb));
  return out;
}

/** Palette that re-resolves whenever the theme flips. */
export function usePalette() {
  const { theme } = useTheme();
  const [palette, setPalette] = useState(readPalette);
  useEffect(() => { setPalette(readPalette()); }, [theme]);
  return palette;
}

export default readPalette;
