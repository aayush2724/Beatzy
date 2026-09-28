import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../ui';
import AnimatedNumber from './AnimatedNumber';
import Swap from './Swap';
import TiltCard from './TiltCard';
import { SAMPLE_TRACKS, findTrack, seeded } from './data';
import { readPalette } from '../../lib/palette';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * The hero's one visual: a track laid out over time. A mirrored waveform with
 * a playhead that drifts through the song (the only thing in the hero that
 * moves on its own), section markers beneath it, the chord under the head,
 * and the track's key numbers. Move the pointer across the wave to scrub;
 * click a section to jump; pick another track from the chips.
 */
const BARS = 112;
const PASS_SECONDS = 48;

function waveFor(track) {
  const rand = seeded(track.seed * 13 + 5);
  const out = new Float32Array(BARS);
  for (let i = 0; i < BARS; i++) {
    const t = (i + 0.5) / BARS;
    const level = sectionAt(track, t)[2];
    out[i] = Math.max(0.06, level * (0.45 + 0.55 * rand()) * (0.72 + 0.28 * track.energy));
  }
  return out;
}

function sectionAt(track, t) {
  let current = track.sections[0];
  for (const s of track.sections) if (t >= s[1]) current = s;
  return current;
}

function clock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TrackAnalyzer({ trackId, onSelect }) {
  const track = findTrack(trackId);
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();
  const [pos, setPos] = useState(0.12);
  const live = useRef({ pos: 0.12, target: waveFor(track), scrubbing: false, lastReport: 0 });
  const targetWave = useMemo(() => waveFor(track), [track]);
  live.current.target = targetWave;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 1;
    let h = 1;
    let colors = readPalette();
    const current = new Float32Array(BARS).fill(0.08);
    let last = performance.now();
    let visible = true;
    let raf = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      colors = readPalette();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      const state = live.current;
      if (!state.scrubbing && !reduced) {
        state.pos += dt / PASS_SECONDS;
        if (state.pos > 1) state.pos -= 1;
      }
      if (now - state.lastReport > 120) {
        state.lastReport = now;
        setPos(state.pos);
      }

      const gap = 2;
      const bw = (w - gap * (BARS - 1)) / BARS;
      const mid = h / 2;
      const headX = state.pos * w;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < BARS; i++) {
        const t = (i + 0.5) / BARS;
        let a = state.target[i];
        const d = Math.abs(t - state.pos) * BARS;
        if (d < 5 && !reduced) a *= 1 + 0.3 * (1 - d / 5) * (0.6 + 0.4 * Math.sin(now / 260 + i * 0.9));
        current[i] += (a - current[i]) * Math.min(1, dt * 6);
        const bh = Math.max(2, current[i] * h * 0.92);
        const x = i * (bw + gap);
        const played = t <= state.pos;
        ctx.globalAlpha = played ? 0.95 : 0.4;
        ctx.fillStyle = played ? colors.brand : colors.lineStrong;
        ctx.beginPath();
        ctx.roundRect(x, mid - bh / 2, bw, bh, bw / 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.accentWarm;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(headX, 0);
      ctx.lineTo(headX, h);
      ctx.stroke();
      ctx.fillStyle = colors.accentWarm;
      ctx.beginPath();
      ctx.arc(headX, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
    };
  }, [reduced]);

  function scrubTo(clientX) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const p = Math.min(0.999, Math.max(0, (clientX - r.left) / r.width));
    live.current.pos = p;
    setPos(p);
  }

  function onKeyDown(e) {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowRight') scrubTo(canvasRef.current.getBoundingClientRect().left + (pos + step) * canvasRef.current.getBoundingClientRect().width);
    else if (e.key === 'ArrowLeft') scrubTo(canvasRef.current.getBoundingClientRect().left + (pos - step) * canvasRef.current.getBoundingClientRect().width);
    else return;
    e.preventDefault();
  }

  const section = sectionAt(track, pos);
  const chordNow = track.chords[Math.floor(pos * 32) % track.chords.length];
  const accent = track.accent === 'warm' ? 'text-accent-warm' : 'text-brand';

  return (
    <div className="relative mx-auto w-full max-w-[38rem]">
      <TiltCard max={3} glare={false} className="rounded-[2rem] border border-line bg-surface/75 p-6 shadow-[var(--shadow-md)] backdrop-blur-md sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold tracking-tight text-ink">
              <Swap id={track.id}>{track.title}</Swap>
            </p>
            <p className="text-sm text-ink-muted">
              <Swap id={track.id}>{track.artist}</Swap>
            </p>
          </div>
          <Badge variant="brand" dot>Analyzed · {track.latencyMs} ms</Badge>
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Playhead position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos * 100)}
          aria-valuetext={`${clock(pos * track.duration)} of ${clock(track.duration)}, ${section[0]}`}
          onPointerMove={(e) => {
            live.current.scrubbing = true;
            scrubTo(e.clientX);
          }}
          onPointerDown={(e) => scrubTo(e.clientX)}
          onPointerLeave={() => {
            live.current.scrubbing = false;
          }}
          onKeyDown={onKeyDown}
          className="mt-5 cursor-crosshair rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        >
          <canvas ref={canvasRef} className="block h-32 w-full sm:h-36" aria-hidden="true" />
        </div>

        <div className="mt-2 flex h-6 overflow-hidden rounded-md" role="group" aria-label="Sections">
          {track.sections.map(([label, start], i) => {
            const end = track.sections[i + 1]?.[1] ?? 1;
            const active = section === track.sections[i];
            return (
              <button
                key={`${label}-${start}`}
                type="button"
                onClick={() => {
                  live.current.pos = start + 0.002;
                  setPos(live.current.pos);
                }}
                style={{ width: `${(end - start) * 100}%` }}
                className={cn(
                  'truncate border-r border-canvas px-1 text-[0.625rem] font-medium uppercase tracking-[0.06em] transition-colors last:border-r-0',
                  active ? 'bg-brand/20 text-brand' : 'bg-veil-2 text-ink-faint hover:bg-veil-3 hover:text-ink-muted',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-mono text-xs tabular-nums text-ink-muted">
            {clock(pos * track.duration)} <span className="text-ink-faint">/ {clock(track.duration)}</span>
          </p>
          <div className="flex items-center gap-1.5" aria-label="Chords">
            {track.chords.map((c) => (
              <span
                key={c}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-xs transition-colors duration-[var(--duration-normal)]',
                  c === chordNow ? 'border-brand/50 bg-brand/10 text-brand' : 'border-line text-ink-muted',
                )}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">Tempo</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
              <AnimatedNumber value={track.bpm} />
              <span className="ml-1 text-sm font-medium text-ink-muted">BPM</span>
            </p>
          </div>
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">Key</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink"><Swap id={track.id}>{track.key}</Swap></p>
          </div>
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">Mood</p>
            <p className={cn('mt-1 font-display text-2xl font-semibold', accent)}><Swap id={track.id}>{track.mood}</Swap></p>
          </div>
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">Energy</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
              <AnimatedNumber value={track.energy} format={(v) => v.toFixed(2)} />
            </p>
          </div>
        </div>
      </TiltCard>

      <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Sample track">
        {SAMPLE_TRACKS.map((t) => {
          const active = t.id === track.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(t.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors duration-[var(--duration-normal)]',
                active ? 'border-brand/50 bg-brand/10 text-brand' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {t.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
