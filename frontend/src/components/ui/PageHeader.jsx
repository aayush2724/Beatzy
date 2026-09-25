import { cn } from '../../lib/utils';

/**
 * The top of every app page: a small eyebrow, a title in the display face at
 * a sensible size, one line of context, and the page's actions on the right.
 */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 border-b border-line-subtle pb-8 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow && (
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
          {title}
        </h1>
        {description && <p className="text-[0.9375rem] leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/** A section title inside a page, with an optional action on the right. */
export function SectionHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-end justify-between gap-6', className)}>
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {description && <p className="text-[0.8125rem] text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
