import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const tones = {
  brand: 'bg-brand',
  warm: 'bg-accent-warm',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-line-strong',
};

/** A thin meter. `value` is 0–100; give it a `label` and it renders the row above. */
export function Progress({ value = 0, label, display, tone = 'brand', className }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('w-full', className)}>
      {(label || display) && (
        <div className="mb-2 flex items-baseline justify-between gap-4 text-xs">
          {label && <span className="text-ink-muted">{label}</span>}
          {display && <span className="tabular-nums text-ink">{display}</span>}
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-veil-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <motion.div
          className={cn('h-full rounded-full', tones[tone] || tones.brand)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
