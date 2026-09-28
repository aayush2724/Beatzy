import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * The waveform ribbon behind the hero. It rests as a still line and only
 * moves while the pointer is over the hero: the amplitude swells under the
 * pointer and the phase drifts, then it settles back to rest.
 *
 * Cost: one path string per frame (24 fps) for 141 points, and only while
 * the pointer is inside. Never moves under prefers-reduced-motion.
 */
const POINTS = 140;
const WIDTH = 1600;
const MID = 100;
const FRAME_MS = 1000 / 24;

function buildPath(phase, pointerX, bulge) {
  const parts = new Array(POINTS + 1);
  for (let i = 0; i <= POINTS; i++) {
    const t = i / POINTS;
    const envelope = Math.sin(t * Math.PI) ** 1.5;
    let amp = 1;
    if (bulge > 0.001) {
      const d = (t - pointerX) / 0.11;
      amp += 1.1 * bulge * Math.exp(-d * d);
    }
    const y =
      MID +
      envelope *
        amp *
        (Math.sin(t * 46 + phase) * 34 +
          Math.sin(t * 11 - phase * 0.6) * 22 +
          Math.sin(t * 90 + phase * 1.7) * 5 * bulge);
    parts[i] = `${i === 0 ? 'M' : 'L'}${(t * WIDTH).toFixed(1)} ${y.toFixed(1)}`;
  }
  return parts.join(' ');
}

export default function HeroWave({ className = '' }) {
  const hostRef = useRef(null);
  const lineRef = useRef(null);
  const glowRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const setPath = (d) => {
      lineRef.current?.setAttribute('d', d);
      glowRef.current?.setAttribute('d', d);
    };

    if (reduced) {
      setPath(buildPath(0, 0.5, 0));
      return undefined;
    }

    let raf = 0;
    let last = 0;
    let phase = 0;
    let visible = true;
    let pointerX = 0.5;
    let bulge = 0;
    let bulgeTarget = 0;
    setPath(buildPath(0, 0.5, 0));

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const awake = bulgeTarget > 0 || bulge > 0.004;
      if (!visible || !awake || now - last < FRAME_MS) return;
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      phase += dt * 1.15;
      bulge += (bulgeTarget - bulge) * 0.12;
      setPath(buildPath(phase, pointerX, bulge));
    };

    const stage = host.closest('section') ?? host.parentElement;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      pointerX = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      bulgeTarget = 1;
    };
    const onLeave = () => {
      bulgeTarget = 0;
    };
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', onLeave);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  return (
    <svg
      ref={hostRef}
      className={className}
      viewBox={`0 0 ${WIDTH} 200`}
      preserveAspectRatio="none"
      style={{ willChange: 'transform' }}
    >
      <defs>
        <linearGradient id="hero-wave" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--brand)" stopOpacity="0" />
          <stop offset="0.3" stopColor="var(--brand)" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="var(--accent-warm)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--accent-warm)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path ref={glowRef} fill="none" stroke="url(#hero-wave)" strokeWidth="6" vectorEffect="non-scaling-stroke" opacity="0.18" />
      <path ref={lineRef} fill="none" stroke="url(#hero-wave)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
