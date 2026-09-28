import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { EASE } from './data';
import SplitReveal from './SplitReveal';

/**
 * The closing banner. A soft spotlight follows the pointer across the brand
 * surface (two CSS variables, updated at most once per frame) and the button
 * lifts on hover.
 */
export default function SpotlightCta({ to }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  function onMove(e) {
    if (reduced || frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      el.style.setProperty('--spot', '1');
    });
  }

  function onLeave() {
    ref.current?.style.setProperty('--spot', '0');
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="spotlight mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-brand/25 bg-brand p-8 text-brand-ink md:p-12"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-dashed border-brand-ink/15" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-[18rem] w-[18rem] rounded-full border border-brand-ink/10" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.34em] opacity-70">START BUILDING</p>
          <SplitReveal text="Start with your next track." className="mt-3 max-w-4xl font-display text-4xl font-semibold tracking-tight md:text-5xl" />
          <p className="mt-5 max-w-4xl text-lg font-medium leading-8 opacity-80">
            Launch with hosted analysis, dashboard uploads, and API access for recognition-first music products.
          </p>
        </div>
        <motion.div whileHover={{ y: -4 }} whileTap={{ y: 1 }} transition={{ duration: 0.3, ease: EASE }}>
          <Link
            to={to}
            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-canvas px-9 text-sm font-semibold uppercase tracking-[0.16em] text-brand shadow-[0_18px_0_rgba(0,0,0,.25)]"
          >
            Get started<ArrowUpRight className="ml-2 h-6 w-6" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
