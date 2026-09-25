import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SearchField = forwardRef(function SearchField(
  { className, loading = false, size = 'md', ...props },
  ref,
) {
  const height = size === 'lg' ? 'h-14 text-[0.9375rem] pl-12 pr-12' : 'h-11 text-sm pl-10 pr-10';
  const iconLeft = size === 'lg' ? 'left-4' : 'left-3.5';
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className={cn('pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint', iconLeft)}
        aria-hidden
      />
      <input
        ref={ref}
        type="search"
        className={cn(
          'w-full rounded-xl border border-line bg-surface text-ink placeholder:text-ink-faint',
          'transition-colors duration-[var(--duration-normal)] focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20',
          height,
        )}
        {...props}
      />
      {loading && (
        <span
          className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
          aria-label="Searching"
        />
      )}
    </div>
  );
});
