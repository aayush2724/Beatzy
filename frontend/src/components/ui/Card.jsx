import clsx from 'clsx';

export function Card({ className, hover, glass = true, children, ...props }) {
  return (
    <div
      className={clsx(
        glass ? 'glass-card' : 'rounded-xl border border-glass-border bg-surface-container p-6',
        hover && 'card-hover cursor-default',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardPanel({ className, children, ...props }) {
  return (
    <div className={clsx('glass-panel p-6 rounded-xl border border-glass-border', className)} {...props}>
      {children}
    </div>
  );
}
