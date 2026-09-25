import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/auth';
import { Wordmark } from '../components/PublicShell';
import { Card } from '../components/ui';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setAuth, setTokens } = useAuthStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh') ?? undefined;
    if (!token) {
      navigate('/login');
      return;
    }
    setTokens(token, refresh);

    let cancelled = false;
    getMe()
      .then(({ data }) => {
        if (cancelled) return;
        setAuth(data.data.user, token, refresh);
        setMessage('Done — opening the app.');
        toast.success('Signed in with Google');
        navigate('/upload');
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || err.message || 'Sign-in failed');
        navigate('/login');
      });
    return () => { cancelled = true; };
  }, [navigate, params, setAuth, setTokens]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <nav className="mx-auto flex h-16 w-full max-w-[90rem] items-center px-5 sm:px-8"><Wordmark /></nav>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <Card padding="lg" className="w-full max-w-sm text-center">
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-brand/25 border-t-brand" aria-hidden />
          <p className="mt-5 text-sm text-ink-muted" role="status">{message}</p>
        </Card>
      </main>
    </div>
  );
}
