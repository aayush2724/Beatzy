import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/auth';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setAuth, setTokens } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');
    if (!token) { navigate('/login'); return; }
    setTokens(token, refresh);
    getMe().then(({ data }) => {
      setAuth(data.data.user, token, refresh);
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    }).catch(() => { navigate('/login'); });
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
