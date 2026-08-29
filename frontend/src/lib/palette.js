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
    canvas: '#0F1113', surface: '#16191C', raised: '#1E2226',
    line: '#282D33', lineStrong: '#707A85',
    ink: '#F2F4F6', inkMuted: '#A9B1BA',
    brand: '#4ED9C2', brandDeep: '#2FA895', brandInk: '#04201A',
    accentWarm: '#F5B355',
    ramp: ['#3E4A56', '#2FA895', '#4ED9C2', '#F5B355', '#F6E8CF'],
    ok: '#63D68F', warn: '#F5C044', danger: '#FF8A8A',
  },
  light: {
    canvas: '#F7F8F9', surface: '#EEF0F2', raised: '#E2E5E9',
    line: '#D9DDE2', lineStrong: '#7E8893',
    ink: '#171A1D', inkMuted: '#4E5760',
    brand: '#0F766E', brandDeep: '#12897B', brandInk: '#FFFFFF',
    accentWarm: '#8A5A12',
    ramp: ['#39434D', '#0F766E', '#2FA895', '#B4691E', '#8A5A12'],
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
