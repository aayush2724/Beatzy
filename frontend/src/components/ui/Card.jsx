import { cn } from '../../lib/utils';

// One card, three surfaces. `surface` is the default: an opaque panel with a
// hairline border and no blur, which is what most of the app should sit on.
// `glass` keeps the translucent look for the few places that float over art.
const variants = {
  surface: 'bg-surface border border-line',
  raised: 'bg-raised border border-line',
  glass: 'bg-glass border border-glass-line backdrop-blur-sm',
};

const paddings = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  as: Tag = 'div',
  variant = 'surface',
  padding = 'md',
  hover = false,
  glass,
  className,
  children,
  ...props
}) {
  // `glass` boolean kept for older call sites (`<Card glass>`).
  const surface = glass ? 'glass' : variant;
  return (
    <Tag
      className={cn(
        'relative rounded-2xl shadow-[var(--shadow-sm)] transition-[transform,border-color,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-out)]',
        variants[surface] || variants.surface,
        paddings[padding] || paddings.md,
        hover && 'hover:-translate-y-0.5 hover:border-line-strong/60 hover:shadow-[var(--shadow-md)]',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

// Kept for existing imports; a glass card with medium padding.
export function CardPanel({ className, children, ...props }) {
  return (
    <Card variant="glass" className={className} {...props}>
      {children}
    </Card>
  );
}
