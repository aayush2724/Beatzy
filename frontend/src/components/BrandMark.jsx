import { cn } from '../lib/utils';

/**
 * Beatzy's mark: five waveform bars on a brand-tinted tile. Colours come from
 * tokens (`currentColor` = --brand) so it follows the theme. Keep in sync with
 * public/favicon.svg, public/logo.svg and docs/logo.svg.
 */
const BARS = [
  { x: 3, h: 6, o: 0.45 },
  { x: 7.5, h: 11, o: 0.7 },
  { x: 12, h: 16, o: 1 },
  { x: 16.5, h: 11, o: 0.7 },
  { x: 21, h: 6, o: 0.45 },
];

export default function BrandMark({ className }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] border border-brand/25 bg-brand/10 text-brand',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        {BARS.map(({ x, h, o }) => (
          <rect key={x} x={x - 1.25} y={12 - h / 2} width="2.5" height={h} rx="1.25" fill="currentColor" opacity={o} />
        ))}
      </svg>
    </span>
  );
}
