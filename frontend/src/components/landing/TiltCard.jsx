import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * Tilts toward the pointer in 3D and sweeps a soft glare across its face.
 * Any motion props (variants, whileHover, onClick…) pass straight through,
 * so it can stand in for a `motion.div` or `motion.article`.
 */
export default function TiltCard({ as = 'div', max = 7, glare = true, className, style, children, ...props }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const gOpacity = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 18, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 180, damping: 18, mass: 0.6 });
  const sGlare = useSpring(gOpacity, { stiffness: 120, damping: 20 });
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, color-mix(in oklab, var(--ink) 12%, transparent), transparent 55%)`;
  const Tag = motion[as] ?? motion.div;

  function onPointerMove(e) {
    props.onPointerMove?.(e);
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rx.set((0.5 - py) * max * 2);
    ry.set((px - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
    gOpacity.set(1);
  }

  function onPointerLeave(e) {
    props.onPointerLeave?.(e);
    rx.set(0);
    ry.set(0);
    gOpacity.set(0);
  }

  return (
    <Tag
      {...props}
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ ...style, rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      className={cn('relative [transform-style:preserve-3d]', className)}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: glareBg, opacity: sGlare }}
        />
      )}
    </Tag>
  );
}
