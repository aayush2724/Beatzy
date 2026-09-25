import { Link } from 'react-router-dom';
import { Wordmark } from './PublicShell';
import ThemeToggle from './ThemeToggle';
import { Card } from './ui';

/** Sign-in / sign-up frame: a centred card under a minimal nav. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <nav className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-4 text-sm text-ink-muted">
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="w-full max-w-md">
          <Card padding="lg" className="space-y-6">
            <header className="space-y-1 text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
            </header>
            {children}
          </Card>
          {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
