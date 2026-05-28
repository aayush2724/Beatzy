import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/dashboard', icon: 'analytics', label: 'Dashboard' },
    { to: '/upload', icon: 'waves', label: 'Spectral Engine' },
    { to: '/api-keys', icon: 'key', label: 'API Keys' },
    { to: '/profile', icon: 'account_circle', label: 'Operator Profile' },
  ];

  if (user?.is_admin) {
    navItems.push({ to: '/admin', icon: 'admin_panel_settings', label: 'Admin Terminal' });
  }
  const navigate = useNavigate();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden text-on-surface font-body selection:bg-sonic-lime/30 relative">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(215,255,90,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(215,255,90,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* SideNavBar - Premium Obsidian OS design */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={clsx(
          "h-full z-40 bg-[#080808]/85 backdrop-blur-3xl border-r border-glass-border flex flex-col pt-8 pb-6 transition-all duration-300 select-none shadow-[5px_0_30px_rgba(0,0,0,0.5)] relative shrink-0",
          isSidebarHovered ? "w-64" : "w-20"
        )}
      >
        {/* Core Header */}
        <div className="px-6 mb-10 flex items-center space-x-4 overflow-hidden shrink-0">
          <div className="w-8 h-8 rounded bg-sonic-lime/10 flex items-center justify-center border border-sonic-lime/30 shrink-0 shadow-[0_0_12px_rgba(215,255,90,0.15)] animate-pulse">
            <span className="material-symbols-outlined text-sonic-lime text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <div className={clsx("transition-opacity duration-300 whitespace-nowrap", isSidebarHovered ? "opacity-100" : "opacity-0")}>
            <p className="text-sonic-lime font-bold text-lg leading-none tracking-tight">Spectral OS</p>
            <p className="font-mono text-[9px] text-on-surface-variant tracking-[0.15em] uppercase">AI Core v4.2</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center px-6 py-3.5 transition-all relative overflow-hidden group',
                isActive
                  ? 'bg-sonic-lime/10 text-sonic-lime border-r-4 border-sonic-lime'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.03]'
              )}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              <span className={clsx(
                "ml-6 font-mono text-[11px] tracking-[0.1em] uppercase transition-all duration-300 whitespace-nowrap",
                isSidebarHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              )}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="px-4 mt-auto border-t border-glass-border pt-4">
          <div className="flex items-center gap-3 px-3 py-3.5 mb-2 rounded-lg bg-white/[0.02] border border-glass-border overflow-hidden max-w-full">
            <div className="w-8 h-8 bg-sonic-lime/20 border border-sonic-lime/30 text-sonic-lime rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={clsx("flex-1 min-w-0 transition-opacity duration-300", isSidebarHovered ? "opacity-100" : "opacity-0")}>
              <p className="text-xs font-semibold truncate text-on-surface leading-none mb-1">{user?.name}</p>
              <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest leading-none capitalize">{user?.plan} plan</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-6 w-full px-5 py-3 rounded-lg text-xs font-mono tracking-widest text-on-surface-variant hover:text-white hover:bg-white/[0.03] transition-all"
          >
            <span className="material-symbols-outlined text-lg shrink-0">logout</span>
            <span className={clsx("transition-opacity duration-300 whitespace-nowrap uppercase", isSidebarHovered ? "opacity-100" : "opacity-0")}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="flex-1 overflow-y-auto z-10 relative">
        {/* Dynamic Glowing background nodes */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sonic-lime/3 blur-[150px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-prism-violet/3 blur-[150px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
