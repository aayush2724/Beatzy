import { cn } from '../../lib/utils';

/**
 * A segmented control. `items` are `{ id, label, icon? }`; the active one gets
 * the raised surface, the rest stay quiet.
 */
export function Tabs({ items, value, onChange, className, 'aria-label': ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1', className)}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[0.8125rem] font-medium transition-colors duration-[var(--duration-normal)]',
              active
                ? 'bg-raised text-ink shadow-[var(--shadow-sm)]'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
