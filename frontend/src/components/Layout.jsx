import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import ThreeDStudio from './ThreeDStudio';
import OnboardingTour from './OnboardingTour';
import { EtherealShadow } from './ui/etheral-shadow';
import { 
  Waves, 
  LayoutDashboard, 
  History, 
  Key, 
  UserCircle, 
  ShieldCheck, 
  LogOut,
  Zap,
  ChevronRight
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/upload', icon: Waves, label: 'Spectral Engine' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/history', icon: History, label: 'Track History' },
    { to: '/api-keys', icon: Key, label: 'API Keys' },
    { to: '/profile', icon: UserCircle, label: 'Operator Profile' },
  ];

  if (user?.is_admin) {
    navItems.push({ to: '/admin', icon: ShieldCheck, label: 'Admin Terminal' });
  }
  const navigate = useNavigate();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-screen overflow-hidden text-on-surface font-body selection:bg-[#c41e3a]/30 relative bg-[#120509]">
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <EtherealShadow
          color="rgba(10, 10, 10, 1)"
          animation={{ scale: 30, speed: 15 }}
          noise={{ opacity: 0.15, scale: 1 }}
          sizing="fill"
        />
      </div>
      <ThreeDStudio />
      
      {/* SideNavBar - Obsidian Control Panel */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={clsx(
          "h-full z-40 bg-[#1a0a12]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col pt-8 pb-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none relative shrink-0",
          isSidebarHovered ? "w-64" : "w-20"
        )}
      >
        {/* Core Header */}
        <div className="px-6 mb-12 flex items-center space-x-4 overflow-hidden shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#c41e3a]/10 flex items-center justify-center border border-[#c41e3a]/20 shrink-0 shadow-[0_0_20px_rgba(196,30,58,0.1)]">
            <Zap className="w-4 h-4 text-[#c41e3a] fill-[#c41e3a]" />
          </div>
          <motion.div 
            animate={{ opacity: isSidebarHovered ? 1 : 0, x: isSidebarHovered ? 0 : -10 }}
            className="whitespace-nowrap"
          >
            <p className="text-white font-bold text-lg leading-none tracking-[0.2em] font-display">BEATZY</p>
            <p className="font-mono text-[8px] text-[#c41e3a]/60 tracking-[0.3em] uppercase mt-1">OS V4.2</p>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center h-12 rounded-xl transition-all duration-300 relative group overflow-hidden',
                isActive
                  ? 'bg-white/[0.05] text-white'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/[0.02]'
              )}
            >
              <div className="w-14 flex justify-center items-center shrink-0">
                <Icon className={clsx("w-5 h-5 transition-transform duration-300 group-hover:scale-110")} />
              </div>
              <motion.span 
                animate={{ opacity: isSidebarHovered ? 1 : 0, x: isSidebarHovered ? 0 : -5 }}
                className="font-mono text-[10px] tracking-[0.15em] uppercase whitespace-nowrap"
              >
                {label}
              </motion.span>
              {isSidebarHovered && (
                <ChevronRight className="w-3 h-3 ml-auto mr-4 opacity-0 group-hover:opacity-40 transition-opacity" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="px-3 mt-auto pt-6 border-t border-white/5">
          <div className={clsx(
            "flex items-center gap-3 px-2 py-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all",
            isSidebarHovered ? "w-full" : "w-12 mx-auto"
          )}>
            <div className="w-8 h-8 bg-[#c41e3a]/10 border border-[#c41e3a]/20 text-[#c41e3a] rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {isSidebarHovered && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[11px] font-semibold truncate text-white leading-none mb-1">{user?.name}</p>
                <p className="font-mono text-[8px] text-[#c41e3a] uppercase tracking-widest leading-none opacity-70">{user?.plan}</p>
              </motion.div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center h-12 mt-2 rounded-xl text-on-surface-variant hover:text-white hover:bg-white/[0.02] transition-all group",
              isSidebarHovered ? "w-full" : "w-12 mx-auto"
            )}
          >
            <div className="w-14 flex justify-center items-center shrink-0">
              <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <motion.span 
              animate={{ opacity: isSidebarHovered ? 1 : 0 }}
              className="font-mono text-[10px] tracking-[0.15em] uppercase whitespace-nowrap"
            >
              System Exit
            </motion.span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="flex-1 overflow-y-auto z-10 relative custom-scrollbar">
        <div className="max-w-[1720px] mx-auto p-6 md:p-12 relative z-10">
          <Outlet />
        </div>
      </main>
      <OnboardingTour />
    </div>
  );
}
