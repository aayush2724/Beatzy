import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import OnboardingTour from './OnboardingTour';
import {
  Waves,
  LayoutDashboard,
  History,
  Library,
  Key,
  UserCircle,
  ShieldCheck,
  LogOut,
  Zap,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();

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
  const navigate = useNavigate();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-screen overflow-hidden text-on-surface font-body selection:bg-brand/30 relative bg-canvas">
      {/* Background: two still glows on the canvas. The WebGL scene and the
          animated turbulence shader that used to sit here redrew the whole
          viewport every frame — that was the lag, and the shimmer. */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(60rem 40rem at 12% -10%, color-mix(in oklab, var(--brand) 7%, transparent), transparent 70%),' +
            'radial-gradient(48rem 36rem at 100% 100%, color-mix(in oklab, var(--accent-warm) 4%, transparent), transparent 70%)',
        }}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={clsx(
          "h-full z-40 bg-surface border-r border-line-subtle flex flex-col pt-6 pb-5 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none relative shrink-0",
          isSidebarHovered ? "w-60" : "w-[4.5rem]"
        )}
      >
        {/* Wordmark */}
        <div className="px-5 mb-8 flex items-center gap-3 overflow-hidden shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center border border-brand/20 shrink-0">
            <Zap className="w-4 h-4 text-brand fill-brand" />
          </div>
          <motion.p
            animate={{ opacity: isSidebarHovered ? 1 : 0, x: isSidebarHovered ? 0 : -8 }}
            className="whitespace-nowrap font-display text-[0.9375rem] font-semibold tracking-[0.12em] text-ink"
          >
            BEATZY
          </motion.p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={isSidebarHovered ? undefined : label}
              className={({ isActive }) => clsx(
                'flex items-center h-11 rounded-lg transition-colors duration-200 relative group',
                isActive
                  ? 'bg-veil-2 text-ink'
                  : 'text-ink-muted hover:text-ink hover:bg-veil-1'
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />}
                  <div className="w-12 flex justify-center items-center shrink-0">
                    <Icon className="w-[1.125rem] h-[1.125rem]" />
                  </div>
                  <motion.span
                    animate={{ opacity: isSidebarHovered ? 1 : 0, x: isSidebarHovered ? 0 : -4 }}
                    className="text-[0.8125rem] font-medium whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Account */}
        <div className="px-3 mt-auto pt-5 border-t border-line-subtle">
          <div className={clsx(
            "flex items-center gap-3 px-2 py-2.5 rounded-lg border border-line-subtle bg-veil-1 transition-[width]",
            isSidebarHovered ? "w-full" : "w-12 mx-auto"
          )}>
            <div className="w-8 h-8 bg-brand/10 border border-brand/20 text-brand rounded-lg flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {isSidebarHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[0.8125rem] font-medium truncate text-ink leading-tight">{user?.name}</p>
                <p className="text-[0.6875rem] text-ink-muted capitalize leading-tight">{user?.plan} plan</p>
              </motion.div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center h-11 mt-1 rounded-lg text-ink-muted hover:text-ink hover:bg-veil-1 transition-colors",
              isSidebarHovered ? "w-full" : "w-12 mx-auto"
            )}
          >
            <div className="w-12 flex justify-center items-center shrink-0">
              <LogOut className="w-[1.125rem] h-[1.125rem]" />
            </div>
            <motion.span
              animate={{ opacity: isSidebarHovered ? 1 : 0 }}
              className="text-[0.8125rem] font-medium whitespace-nowrap"
            >
              Sign out
            </motion.span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="flex-1 overflow-y-auto z-10 relative custom-scrollbar">
        <div className="max-w-[100rem] mx-auto p-6 md:p-10 relative z-10">
          <Outlet />
        </div>
      </main>
      <OnboardingTour />
    </div>
  );
}
