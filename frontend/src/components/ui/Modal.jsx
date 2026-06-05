import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Button } from './Button';

export function Modal({ open, onClose, title, children, className, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <motion.button
            type="button"
            className="absolute inset-0 bg-[#2A1A15]/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            className={clsx('relative w-full glass-panel border border-glass-border p-6 shadow-2xl', sizes[size], className)}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              {title && (
                <h2 id="modal-title" className="font-headline text-lg text-on-surface uppercase tracking-wide">
                  {title}
                </h2>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog" className="shrink-0 !p-2">
                <span className="material-symbols-outlined text-lg">close</span>
              </Button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
