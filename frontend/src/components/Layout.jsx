import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  Waves,
  LayoutDashboard,
  History,
  Library,
  Key,
  UserCircle,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFocusTrap } from '../hooks/useFocusTrap';
import OnboardingTour from './OnboardingTour';
import BrandMark from './BrandMark';
import { IconButton } from './ui';

/**
 * The signed-in frame. On `md` and up: a rail that widens on hover or when a
 * link inside it has focus. Below `md`: a top bar with a menu button that
 * opens a drawer, because hover does not exist on touch screens.
 */
export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);

  const navItems = [
    { to: '/upload', icon: Waves, label: 'Analyze' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/api-keys', icon: Key, label: 'API keys' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];
  if (user?.is_admin) {
    navItems.push({ to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  // Close the drawer on navigation, and keep focus inside it while open.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useFocusTrap(drawerRef, menuOpen, () => setMenuOpen(false));
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-canvas font-body text-on-surface selection:bg-brand/30 md:flex-row">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Background: two still glows on the canvas. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(60rem 40rem at 12% -10%, color-mix(in oklab, var(--brand) 7%, transparent), transparent 70%),' +
            'radial-gradient(48rem 36rem at 100% 100%, color-mix(in oklab, var(--accent-warm) 4%, transparent), transparent 70%)',
        }}
      />

      {/* ---------- Mobile top bar ---------- */}
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-line-subtle bg-surface px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <Link to="/dashboard" className="inline-flex items-center gap-2.5" aria-label="Beatzy dashboard">
          <BrandMark />
          <span className="font-display text-[0.9375rem] font-semibold tracking-[0.12em] text-ink">BEATZY</span>
        </Link>
        <IconButton
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
        </IconButton>
      </header>

      {/* ---------- Mobile drawer ---------- */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
          />
          <nav
            id="mobile-nav"
            ref={drawerRef}
            aria-label="Main"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-line bg-surface px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-lg)] focus:outline-none"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-display text-[0.9375rem] font-semibold tracking-[0.12em] text-ink">Menu</span>
              <IconButton size="sm" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X className="h-4 w-4" aria-hidden />
              </IconButton>
            </div>
            <ul className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      clsx(
                        'flex h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium transition-colors',
                        isActive ? 'bg-veil-2 text-ink' : 'text-ink-muted hover:bg-veil-1 hover:text-ink',
                      )
                    }
                  >
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-line-subtle pt-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-xs font-semibold text-brand" aria-hidden="true">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium leading-tight text-ink">{user?.name}</p>
                  <p className="text-[0.6875rem] capitalize leading-tight text-ink-muted">{user?.plan} plan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium text-ink-muted transition-colors hover:bg-veil-1 hover:text-ink"
              >
                <LogOut className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ---------- Desktop sidebar ---------- */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setExpanded(false);
        }}
        className={clsx(
          'relative z-40 hidden h-full shrink-0 select-none flex-col border-r border-line-subtle bg-surface pb-5 pt-6 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex',
          expanded ? 'w-60' : 'w-[4.5rem]',
        )}
      >
        <div className="mb-8 flex shrink-0 items-center gap-3 overflow-hidden px-5">
          <BrandMark />
          <motion.p
            aria-hidden={!expanded}
            animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
            className="whitespace-nowrap font-display text-[0.9375rem] font-semibold tracking-[0.12em] text-ink"
          >
            BEATZY
          </motion.p>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              title={expanded ? undefined : label}
              className={({ isActive }) =>
                clsx(
                  'group relative flex h-11 items-center rounded-lg transition-colors duration-200',
                  isActive ? 'bg-veil-2 text-ink' : 'text-ink-muted hover:bg-veil-1 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" aria-hidden="true" />}
                  <div className="flex w-12 shrink-0 items-center justify-center">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                  </div>
                  <motion.span
                    aria-hidden="true"
                    animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -4 }}
                    className="whitespace-nowrap text-[0.8125rem] font-medium"
                  >
                    {label}
                  </motion.span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-line-subtle px-3 pt-5">
          <div
            className={clsx(
              'flex items-center gap-3 rounded-lg border border-line-subtle bg-veil-1 px-2 py-2.5 transition-[width]',
              expanded ? 'w-full' : 'mx-auto w-12',
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-xs font-semibold text-brand" aria-hidden="true">
              {initial}
            </div>
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium leading-tight text-ink">{user?.name}</p>
                <p className="text-[0.6875rem] capitalize leading-tight text-ink-muted">{user?.plan} plan</p>
              </motion.div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title={expanded ? undefined : 'Sign out'}
            className={clsx(
              'mt-1 flex h-11 items-center rounded-lg text-ink-muted transition-colors hover:bg-veil-1 hover:text-ink',
              expanded ? 'w-full' : 'mx-auto w-12',
            )}
          >
            <div className="flex w-12 shrink-0 items-center justify-center">
              <LogOut className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            </div>
            <motion.span aria-hidden="true" animate={{ opacity: expanded ? 1 : 0 }} className="whitespace-nowrap text-[0.8125rem] font-medium">
              Sign out
            </motion.span>
          </button>
        </div>
      </aside>

      {/* ---------- Main content ---------- */}
      <main id="main" tabIndex={-1} className="custom-scrollbar relative z-10 flex-1 overflow-y-auto focus:outline-none">
        <div className="relative z-10 mx-auto max-w-[100rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 md:p-10">
          <Outlet />
        </div>
      </main>
      <OnboardingTour />
    </div>
  );
}
