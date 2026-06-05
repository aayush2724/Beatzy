import clsx from 'clsx';

const variants = {
  default: 'bg-white/10 text-on-surface border-[#1A1410]/10',
  accent: 'bg-accent/10 text-accent border-accent/20',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  muted: 'bg-surface-container-high text-muted border-glass-border',
};

export function Badge({ variant = 'default', className, children }) {
  return (
    <span className={clsx('badge border', variants[variant], className)}>
      {children}
    </span>
  );
}
