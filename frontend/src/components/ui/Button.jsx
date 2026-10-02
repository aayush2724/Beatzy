import { forwardRef } from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'bg-transparent border border-transparent text-on-surface-variant hover:text-on-surface hover:bg-ink/5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-[var(--duration-normal)]',
  // Tokens, not Tailwind reds: `text-red-300` on a light surface fails contrast.
  danger: 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 px-4 py-2 rounded-xl font-semibold text-sm transition-all',
};

const sizes = {
  sm: 'text-xs px-4 py-2',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, children, magnetic, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type || 'button'}
      className={clsx(
        variants[variant],
        sizes[size],
        magnetic && 'magnetic-btn',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <a
      className={clsx(variants[variant], sizes[size], 'inline-flex items-center justify-center', className)}
      {...props}
    />
  );
}
