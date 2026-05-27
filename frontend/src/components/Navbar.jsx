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
    handleScroll(); // Check initially

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`fixed top-0 w-full z-50 border-b border-outline-variant/20 shadow-[0_0_20px_rgba(0,245,255,0.05)] transition-all duration-300 ${scrolled ? 'bg-surface/95 py-3' : 'bg-surface/80 py-4'}`}>
      <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto">
        <Link to="/" className="font-headline-xl text-headline-lg tracking-tighter text-sonic-lime hover:brightness-110 transition-all">
          Beatzy AI
        </Link>
        <div className="hidden md:flex space-x-8 items-center">
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/')
                ? 'text-sonic-lime border-b-2 border-sonic-lime pb-1'
                : 'text-on-surface-variant hover:text-primary-fixed'
            }`}
            to="/"
          >
            Main Stage
          </Link>
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/artist-echoes')
                ? 'text-sonic-lime border-b-2 border-sonic-lime pb-1'
                : 'text-on-surface-variant hover:text-primary-fixed'
            }`}
            to="/artist-echoes"
          >
            Inside the Wave
          </Link>
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/artist-echoes')
                ? 'text-sonic-lime border-b-2 border-sonic-lime pb-1'
                : 'text-on-surface-variant hover:text-primary-fixed'
            }`}
            to="/artist-echoes"
          >
            Artist Echoes
          </Link>
          <Link
            className={`font-body-md text-body-md transition-all ${
              isLinkActive('/pricing')
                ? 'text-sonic-lime border-b-2 border-sonic-lime pb-1'
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
            className="material-symbols-outlined text-on-surface hover:text-sonic-lime transition-all cursor-pointer p-2 rounded-full hover:backdrop-brightness-125"
          >
            account_circle
          </Link>
        </div>
      </div>
    </nav>
  );
}
