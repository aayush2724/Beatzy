import { cn } from '../../lib/utils';
import { Card } from './Card';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card
      padding="lg"
      className={cn('flex flex-col items-center justify-center gap-4 text-center', className)}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line-subtle bg-veil-2">
          <Icon className="h-5 w-5 text-ink-faint" aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold tracking-tight text-ink">{title}</p>
        {description && <p className="max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </Card>
  );
}
