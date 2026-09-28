import { Fragment, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { EASE } from './data';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * The hero headline. Letters fall into place one by one, each letter lifts
 * under the pointer, the accent line carries a moving gradient, and the whole
 * block tilts in 3D toward wherever the pointer is over the hero.
 */
const lineVariants = (index) => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: index * 0.22 } },
});
const glyph = {
  hidden: { opacity: 0, y: 70, rotateX: 45, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE } },
};

function Letters({ text, index }) {
  const words = text.split(' ');
  return (
    <motion.span variants={lineVariants(index)} className="inline" aria-hidden="true">
      {words.map((word, w) => (
        <Fragment key={w}>
          <span className="inline-block whitespace-nowrap">
            {[...word].map((c, i) => (
              <motion.span
                key={i}
                variants={glyph}
                whileHover={{ y: -14, scale: 1.08, transition: { duration: 0.25, ease: EASE } }}
                className="inline-block cursor-default transition-colors duration-300 hover:text-brand"
              >
                {c}
              </motion.span>
            ))}
          </span>
          {/* the space lives between the word boxes, so it can break a line and never collapses */}
          {w < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </motion.span>
  );
}

export default function KineticTitle({ lines, className }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 70, damping: 20 });
  const sry = useSpring(ry, { stiffness: 70, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return undefined;
    const stage = el.closest('section') ?? el.parentElement;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      rx.set(((e.clientY - r.top) / r.height - 0.5) * -7);
      ry.set(((e.clientX - r.left) / r.width - 0.5) * 9);
    };
    const onLeave = () => {
      rx.set(0);
      ry.set(0);
    };
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, rx, ry]);

  return (
    <motion.h1
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1200 }}
      className={cn('[transform-style:preserve-3d]', className)}
    >
      <span className="sr-only">{lines.map((l) => l.text).join(' ')}</span>
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l.shimmer ? (
            <motion.span variants={lineVariants(i)} className="inline-block" aria-hidden="true">
              <motion.span variants={glyph} className="text-shimmer inline-block">
                {l.text}
              </motion.span>
            </motion.span>
          ) : (
            <Letters text={l.text} index={i} />
          )}
        </span>
      ))}
    </motion.h1>
  );
}
