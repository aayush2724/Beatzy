import { useState, useId } from 'react';
import clsx from 'clsx';

export function Tooltip({ content, children, side = 'top', className }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible && content && (
        <span
          id={id}
          role="tooltip"
          className={clsx(
            'absolute z-50 px-2.5 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider',
            'bg-surface-container-highest border border-glass-border text-on-surface whitespace-nowrap pointer-events-none',
            positions[side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
