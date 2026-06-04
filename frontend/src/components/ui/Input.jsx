import { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(function Input({ className, error, label, id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx('input', error && 'border-red-500/50 focus:border-red-500/50', className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
});
