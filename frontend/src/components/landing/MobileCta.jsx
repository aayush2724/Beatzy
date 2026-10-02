import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * A fixed call to action for phones, shown only once the hero (which has the
 * primary button) has scrolled away, and hidden again near the footer so it
 * never covers the closing banner or the footer links. Respects the home
 * indicator inset. Hidden on `md` and up, where the hero button is always
 * within reach.
 */
export default function MobileCta({ to, heroRef }) {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const hero = heroRef?.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined;
    let heroGone = false;
    let footerNear = false;
    const update = () => setVisible(heroGone && !footerNear);
    const heroIo = new IntersectionObserver(([e]) => {
      heroGone = !e.isIntersecting;
      update();
    }, { threshold: 0.05 });
    heroIo.observe(hero);
    const footer = document.querySelector('footer');
    const footerIo = footer
      ? new IntersectionObserver(([e]) => {
          footerNear = e.isIntersecting;
          update();
        }, { rootMargin: '0px 0px 120px 0px' })
      : null;
    footerIo?.observe(footer);
    return () => {
      heroIo.disconnect();
      footerIo?.disconnect();
    };
  }, [heroRef]);

  return (
    <div
      aria-hidden={!visible}
      className={[
        'fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden',
        'bg-gradient-to-t from-canvas via-canvas/95 to-transparent',
        reduced ? '' : 'transition-[transform,opacity] duration-300 ease-[var(--ease-out)]',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      ].join(' ')}
    >
      <Link
        to={to}
        tabIndex={visible ? 0 : -1}
        className="btn-primary flex min-h-12 w-full items-center justify-center gap-2 text-sm"
      >
        Start analyzing <ArrowUpRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
