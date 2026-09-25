import { cn } from '../../lib/utils';

// Status colours come from the semantic tokens, never from Tailwind's palette,
// so they hold up in light mode and stay outside the brand hue.
const variants = {
  neutral: 'bg-veil-2 text-ink-muted border-line',
  brand: 'bg-brand/10 text-brand border-brand/20',
  ok: 'bg-ok/10 text-ok border-ok/20',
  warn: 'bg-warn/10 text-warn border-warn/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  warm: 'bg-accent-warm/10 text-accent-warm border-accent-warm/20',
};

// Older call sites use these names.
const aliases = {
  default: 'neutral',
  muted: 'neutral',
  accent: 'brand',
  success: 'ok',
  warning: 'warn',
};

export function Badge({ variant = 'neutral', dot = false, className, children }) {
  const key = aliases[variant] || variant;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide',
        variants[key] || variants.neutral,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
