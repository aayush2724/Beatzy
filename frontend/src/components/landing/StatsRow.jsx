import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { Card } from '../ui';
import AnimatedNumber from './AnimatedNumber';
import TiltCard from './TiltCard';
import { EASE, fadeUp, stagger, seeded } from './data';

/**
 * Four headline numbers. Each counts up when it scrolls into view and draws a
 * small trend line beside its label. Tiles tilt toward the pointer, and the
 * whole row leans with the scroll velocity.
 */
function sparkline(seed, trend) {
  const rand = seeded(seed);
  const pts = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const base = trend > 0 ? 26 - t * 16 : 10 + t * 14;
    return [t * 120, base + (rand() - 0.5) * 8];
  });
  return {
    d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '),
    end: pts[pts.length - 1],
  };
}

const STATS = [
  { id: 'tracks', value: 100, format: (v) => `${Math.round(v)}M+`, label: 'Tracks in the database', hint: 'Fingerprints indexed across labels and independents', seed: 2, trend: 1 },
  { id: 'speed', value: 2.6, format: (v) => `${v.toFixed(1)}s`, label: 'Average analysis time', hint: 'From upload to a complete report', seed: 5, trend: -1 },
  { id: 'accuracy', value: 99.8, format: (v) => `${v.toFixed(1)}%`, label: 'Identification accuracy', hint: 'On clean studio recordings', seed: 9, trend: 1 },
  { id: 'dimensions', value: 6, format: (v) => Math.round(v).toString(), label: 'Audio dimensions', hint: 'Tempo, key, mood, energy, chords, genre', seed: 13, trend: 1 },
].map((s) => ({ ...s, spark: sparkline(s.seed, s.trend) }));

export default function StatsRow() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const skewY = useSpring(useTransform(velocity, [-2000, 2000], [-3, 3]), { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ skewY }}
      className="mx-auto grid max-w-[1500px] grid-cols-2 gap-4 px-5 md:grid-cols-4"
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {STATS.map((stat) => (
        <TiltCard key={stat.id} variants={fadeUp} max={6} className="group">
          <Card padding="md" hover className="h-full">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-ink-muted">{stat.label}</p>
              <svg viewBox="0 0 120 32" className="h-8 w-[6.5rem] shrink-0 overflow-visible" aria-hidden="true">
                <motion.path
                  d={stat.spark.d}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.8 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
                />
                <circle
                  cx={stat.spark.end[0]}
                  cy={stat.spark.end[1]}
                  r="3"
                  fill="var(--brand)"
                  className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </svg>
            </div>
            <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-brand tabular-nums">
              <AnimatedNumber value={stat.value} format={stat.format} />
            </p>
            <p className="mt-2 text-xs text-ink-faint">{stat.hint}</p>
          </Card>
        </TiltCard>
      ))}
    </motion.div>
  );
}
