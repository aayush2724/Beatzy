import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** A square, quiet button for a single icon. `aria-label` is required. */
export const IconButton = forwardRef(function IconButton(
  { className, size = 'md', active = false, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg border transition-colors duration-[var(--duration-normal)]',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        active
          ? 'border-brand/40 bg-brand/10 text-brand'
          : 'border-line bg-surface text-ink-muted hover:border-line-strong/60 hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
