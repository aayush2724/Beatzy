import { useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside `ref` while `active`: moves focus in on open,
 * wraps Tab / Shift+Tab at the edges, calls `onEscape` on Escape, and
 * returns focus to the previously focused element on close.
 */
export function useFocusTrap(ref, active, onEscape) {
  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return undefined;
    const previous = document.activeElement;

    const focusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => !el.closest('[aria-hidden="true"]') && !el.hidden);

    const first = focusables()[0] || node;
    first.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) {
        e.preventDefault();
        return;
      }
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === node)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [ref, active, onEscape]);
}
