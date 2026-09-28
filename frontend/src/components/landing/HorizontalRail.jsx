import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/utils';

/**
 * Pins its children in the viewport and pans them sideways as the page
 * scrolls, one pixel of scroll per pixel of travel. Below the `lg`
 * breakpoint it is an ordinary vertical stack.
 */
export default function HorizontalRail({ children, className, stackClassName }) {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const pinned = useMediaQuery('(min-width: 1024px)');
  const [travel, setTravel] = useState(0);

  useEffect(() => {
    if (!pinned) return undefined;
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      setTravel(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);

  if (!pinned) {
    return <div className={cn('flex flex-col gap-6', stackClassName)}>{children}</div>;
  }

  return (
    <div ref={ref} style={{ height: `calc(100vh + ${travel}px)` }} className={className}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex items-center gap-6 px-10">
          {children}
        </motion.div>
      </div>
    </div>
  );
}
