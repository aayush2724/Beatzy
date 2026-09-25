import { cn } from '../../lib/utils';

const tones = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  brand: 'bg-brand',
  neutral: 'bg-line-strong',
};

/** A coloured dot with a label — the whole vocabulary for "is this thing up". */
export function StatusDot({ tone = 'neutral', pulse = false, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[0.8125rem] text-ink', className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', tones[tone])} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', tones[tone] || tones.neutral)} />
      </span>
      {children}
    </span>
  );
}
