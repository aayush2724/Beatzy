import { cn } from '../../lib/utils';
import { Card } from './Card';

/**
 * A single number with its label. `hint` is the small line underneath (a unit,
 * a comparison, a date); `children` is a slot for a sparkline or meter.
 */
export function StatTile({ label, value, hint, icon: Icon, className, children }) {
  return (
    <Card padding="md" className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-ink-faint" aria-hidden />}
      </div>
      <p className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
        {value ?? '—'}
      </p>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      {children}
    </Card>
  );
}
