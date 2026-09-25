import { cn } from '../../lib/utils';

/** Key/value rows separated by hairlines. `rows` are `{ label, value }`. */
export function DataList({ rows, className }) {
  return (
    <dl className={cn('divide-y divide-line-subtle', className)}>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between gap-6 py-3 text-[0.8125rem]">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="text-right font-medium tabular-nums text-ink">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
