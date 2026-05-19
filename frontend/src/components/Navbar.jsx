import { Link, useNavigate } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { token, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Music2 size={18} />
          </div>
          <span className="text-xl font-bold">Beatzy</span>
        </Link>

        <div className="flex items-center gap-8 text-sm">
          <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
          {token ? (
            <>
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary text-sm py-2 px-4">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-5">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
