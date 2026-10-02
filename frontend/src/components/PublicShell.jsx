import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CONTACT_EMAIL } from '../config/site';
import ThemeToggle from './ThemeToggle';
import { cn } from '../lib/utils';
import BrandMark from './BrandMark';
import { IconButton } from './ui';

/**
 * The frame for every page outside the signed-in app: one nav, one footer.
 * Pages pass their own content; `width` controls the main column.
 */

const NAV_LINKS = [
  { to: '/#features', label: 'Features', hash: true },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'API' },
  { to: '/status', label: 'Status' },
];

export function Wordmark({ className }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5', className)} aria-label="Beatzy home">
      <BrandMark />
      <span className="font-display text-[0.9375rem] font-semibold tracking-[0.12em] text-ink">BEATZY</span>
    </Link>
  );
}

/** First focusable element on every public page. */
export function SkipLink() {
  return <a href="#main" className="skip-link">Skip to content</a>;
}

function NavItems({ onNavigate, className, itemClassName }) {
  return (
    <ul className={className}>
      {NAV_LINKS.map((l) => (
        <li key={l.to}>
          {l.hash ? (
            <a href={l.to} onClick={onNavigate} className={cn('text-sm text-ink-muted transition-colors hover:text-ink', itemClassName)}>
              {l.label}
            </a>
          ) : (
            <NavLink
              to={l.to}
              onClick={onNavigate}
              className={({ isActive }) => cn('text-sm transition-colors hover:text-ink', isActive ? 'text-ink' : 'text-ink-muted', itemClassName)}
            >
              {l.label}
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  );
}

export function PublicNav() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useFocusTrap(panelRef, open, () => setOpen(false));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <SkipLink />
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <NavItems className="hidden items-center gap-7 md:flex" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {token ? (
            <Link to="/dashboard" className="btn-primary text-sm !px-4 !py-2">Open app</Link>
          ) : (
            <>
              <Link to="/login" className="hidden px-3 text-sm text-ink-muted transition-colors hover:text-ink sm:inline">Log in</Link>
              <Link to="/register" className="btn-primary text-sm !px-4 !py-2">Get started</Link>
            </>
          )}
          <IconButton
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="public-mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </IconButton>
        </div>
      </nav>

      {open && (
        <div
          id="public-mobile-nav"
          ref={panelRef}
          tabIndex={-1}
          className="border-t border-line bg-canvas px-5 py-4 focus:outline-none md:hidden"
        >
          <NavItems
            onNavigate={() => setOpen(false)}
            className="flex flex-col gap-1"
            itemClassName="block rounded-lg px-3 py-2.5 text-[0.9375rem] hover:bg-veil-1"
          />
          {!token && (
            <Link to="/login" onClick={() => setOpen(false)} className="mt-1 block rounded-lg px-3 py-2.5 text-[0.9375rem] text-ink-muted hover:bg-veil-1 hover:text-ink sm:hidden">
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Wordmark />
          <p className="text-sm text-ink-muted">Identify any track and read its tempo, key, chords and mood.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
          <Link to="/docs" className="hover:text-ink">API docs</Link>
          <Link to="/status" className="hover:text-ink">Status</Link>
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">Contact</a>
        </nav>
        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} Beatzy</p>
      </div>
    </footer>
  );
}

export default function PublicShell({ children, width = 'max-w-5xl', className }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicNav />
      <main id="main" tabIndex={-1} className={cn('mx-auto w-full flex-1 px-5 py-12 focus:outline-none sm:px-8 md:py-16', width, className)}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
