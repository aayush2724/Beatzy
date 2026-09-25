import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from './ThemeToggle';
import { cn } from '../lib/utils';

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
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
        <span className="absolute h-2.5 w-2.5 rounded-full bg-brand" />
        <span className="h-6 w-6 rounded-full border border-brand/50" />
      </span>
      <span className="font-display text-[0.9375rem] font-semibold tracking-[0.12em] text-ink">BEATZY</span>
    </Link>
  );
}

export function PublicNav() {
  const token = useAuthStore((s) => s.token);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) =>
            l.hash ? (
              <a key={l.to} href={l.to} className="text-sm text-ink-muted transition-colors hover:text-ink">{l.label}</a>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => cn('text-sm transition-colors hover:text-ink', isActive ? 'text-ink' : 'text-ink-muted')}
              >
                {l.label}
              </NavLink>
            ),
          )}
        </div>
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
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Wordmark />
          <p className="text-sm text-ink-muted">Identify any track and read its tempo, key, chords and mood.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
          <Link to="/docs" className="hover:text-ink">API docs</Link>
          <Link to="/status" className="hover:text-ink">Status</Link>
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          <Link to="/terms" className="hover:text-ink">Terms</Link>
        </div>
        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} Beatzy</p>
      </div>
    </footer>
  );
}

export default function PublicShell({ children, width = 'max-w-5xl', className }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicNav />
      <main className={cn('mx-auto w-full flex-1 px-5 py-12 sm:px-8 md:py-16', width, className)}>{children}</main>
      <PublicFooter />
    </div>
  );
}
