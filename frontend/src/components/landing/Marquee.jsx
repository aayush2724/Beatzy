import { Fragment, useRef, useState } from 'react';
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * A ticker that drifts on its own, speeds up and flips direction with the
 * page's scroll velocity, and rests while the pointer is over it. It only
 * runs while on screen. `renderItem` draws each entry; `reverse` flips the
 * resting direction so two tickers can run against each other.
 */
export function GenreChip({ label }) {
  return (
    <motion.span
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="genre-chip mx-2 inline-flex cursor-default items-center gap-3 rounded-full border border-transparent px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-faint transition-colors hover:border-line hover:bg-surface hover:text-ink"
    >
      <span aria-hidden="true" className="flex h-3.5 items-end gap-[2px]">
        <span className="eq-bar h-full w-[3px] origin-bottom scale-y-[0.35] rounded-full bg-brand" />
        <span className="eq-bar h-full w-[3px] origin-bottom scale-y-[0.7] rounded-full bg-brand" />
        <span className="eq-bar h-full w-[3px] origin-bottom scale-y-[0.5] rounded-full bg-brand" />
      </span>
      {label}
    </motion.span>
  );
}

export function SignalChip({ icon: Icon, label, value }) {
  return (
    <motion.span
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="mx-2 inline-flex cursor-default items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2 text-sm transition-colors hover:border-brand/40"
    >
      {Icon && <Icon className="h-4 w-4 text-brand" aria-hidden />}
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </motion.span>
  );
}

export default function Marquee({ items, renderItem, reverse = false, baseVelocity = 2.4, label, className }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1200], [0, 5], { clamp: false });
  const rest = reverse ? 1 : -1;
  const direction = useRef(rest);
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (!inView || reduced) return;
    const dt = Math.min(delta, 64) / 1000;
    const f = factor.get();
    if (f < -0.05) direction.current = -rest;
    else if (f > 0.05) direction.current = rest;
    let move = paused ? 0 : direction.current * baseVelocity * dt;
    move += direction.current * Math.abs(f) * dt;
    baseX.set(baseX.get() + move);
  });

  return (
    <section aria-label={label} className={cn('relative border-y border-line bg-canvas/70 py-5 backdrop-blur-sm', className)}>
      <div
        ref={ref}
        className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <motion.div className="flex w-max" style={reduced ? undefined : { x }}>
          {[0, 1].map((half) => (
            <div key={half} aria-hidden={half === 1} className="flex shrink-0 items-center">
              {items.map((item, i) => (
                <Fragment key={`${half}-${i}`}>{renderItem(item)}</Fragment>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
