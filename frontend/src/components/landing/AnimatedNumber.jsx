import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { EASE } from './data';

/**
 * Counts from the previous value to `value` the first time it scrolls into view,
 * and again whenever `value` changes. `format` turns the in-flight number into
 * text; it is read through a ref so an inline function does not restart the tween.
 */
export default function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toString(),
  duration = 1.4,
  className,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;
  const current = useRef(0);
  const [display, setDisplay] = useState(() => format(reduced ? value : 0));

  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      current.current = value;
      setDisplay(formatRef.current(value));
      return undefined;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        current.current = v;
        setDisplay(formatRef.current(v));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduced, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
