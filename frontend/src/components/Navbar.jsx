import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { token } = useAuthStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  const glassClasses = scrolled 
    ? 'bg-surface-container-low/95 backdrop-blur-xl' 
    : 'bg-surface-container-low/80 backdrop-blur-lg';

  return (
    <nav className={`fixed top-0 w-full z-50 border-b border-glass-border shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all duration-300 ${glassClasses}`}>
      <div className="flex justify-between items-center px-8 py-4 max-w-[1280px] mx-auto">
        <Link 
          to="/" 
          className="font-headline-xl text-headline-lg tracking-tighter gradient-text hover:brightness-110 transition-all"
        >
          Beatzy AI
        </Link>
        <div className="hidden md:flex space-x-8 items-center">
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/')
                ? 'text-primary border-b-2 border-primary pb-1'
                : 'text-on-surface-variant hover:text-primary-fixed'
            }`}
            to="/"
          >
            Main Stage
          </Link>
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/artist-echoes')
                ? 'text-primary border-b-2 border-primary pb-1'
                : 'text-on-surface-variant hover:text-primary-fixed'
            }`}
            to="/artist-echoes"
          >
            Artist Echoes
          </Link>
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/pricing')
                ? 'text-primary border-b-2 border-primary pb-1'
                : 'text-on-surface-variant hover:text-primary-fixed'
            }`}
            to="/pricing"
          >
            Production Suite
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to={token ? '/dashboard' : '/login'}
            className="material-symbols-outlined text-on-surface hover:text-primary transition-all cursor-pointer p-2 rounded-full hover:bg-white/5"
          >
            account_circle
          </Link>
        </div>
      </div>
    </nav>
  );
}
