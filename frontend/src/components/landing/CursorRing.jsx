import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * A small ring that trails the pointer and opens up over anything clickable.
 * It only moves when the pointer does. Mouse and trackpad only.
 */
export default function CursorRing() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [hot, setHot] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 400, damping: 32, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 400, damping: 32, mass: 0.4 });

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return undefined;
    setEnabled(true);
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHot(Boolean(e.target instanceof Element && e.target.closest('a, button, [role="tab"], input, canvas')));
      setActive(true);
    };
    const onLeave = () => setActive(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, x, y]);

  if (!enabled) return null;
  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-50" style={{ x: sx, y: sy }}>
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand"
        animate={{ width: hot ? 44 : 22, height: hot ? 44 : 22, opacity: active ? (hot ? 0.9 : 0.6) : 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-brand/15"
          animate={{ opacity: hot ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </motion.div>
    </motion.div>
  );
}
