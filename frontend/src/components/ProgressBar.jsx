import React from 'react';
import clsx from 'clsx';

/**
 * ProgressBar – a reusable visual component showing upload / processing progress.
 * Props:
 *   - progress (number): 0‑100 value representing completion percentage.
 *   - label (string, optional): text displayed above the bar.
 *   - className (string, optional): additional Tailwind classes for container styling.
 */
export default function ProgressBar({ progress, label, className }) {
  const pct = Math.min(100, Math.max(0, Math.floor(progress)));
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex justify-between text-xs mb-1 font-mono text-on-surface-variant uppercase tracking-wider">
          <span>{label}</span>
          <span className="text-ink font-bold">{pct}%</span>
        </div>
      )}
      <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-ink shadow-[0_0_10px_color-mix(in_oklab,var(--ink)_20%,transparent)] rounded-full transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
