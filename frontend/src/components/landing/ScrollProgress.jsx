import { motion, useScroll, useSpring } from 'framer-motion';

/** A hairline under the nav that fills as the page scrolls. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-16 z-40 h-0.5 origin-left bg-brand"
      style={{ scaleX }}
    />
  );
}
