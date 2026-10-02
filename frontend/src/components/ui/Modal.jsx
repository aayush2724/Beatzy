import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from './Button';

export function Modal({ open, onClose, title, children, className, size = 'md' }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open, onClose);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-surface/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close dialog"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
            className={clsx('relative w-full glass-panel border border-glass-border p-6 shadow-2xl focus:outline-none', sizes[size], className)}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              {title && (
                <h2 id="modal-title" className="font-display text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog" className="ml-auto shrink-0 !p-2">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
