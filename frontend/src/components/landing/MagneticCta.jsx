import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function MagneticCta({ to, children, className = 'btn-primary px-8 py-4 text-xs' }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  function onMove(e) {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = '';
  }

  return (
    <Link
      ref={ref}
      to={to}
      className={`magnetic-btn inline-block ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Link>
  );
}
