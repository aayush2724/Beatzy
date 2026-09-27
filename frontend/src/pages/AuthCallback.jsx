import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { exchangeGoogleCode } from '../api/auth';
import { Wordmark } from '../components/PublicShell';
import { Card } from '../components/ui';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');
  const started = useRef(false);

  useEffect(() => {
    // The sign-in code is single-use, so guard against StrictMode's double
    // effect run in development redeeming it twice.
    if (started.current) return;
    started.current = true;

    const code = params.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    exchangeGoogleCode(code)
      .then(({ data }) => {
        const { user, accessToken, refreshToken } = data.data;
        setAuth(user, accessToken, refreshToken);
        setMessage('Done — opening the app.');
        toast.success('Signed in with Google');
        // replace: keep the callback URL (and its code) out of history.
        navigate('/upload', { replace: true });
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Sign-in failed';
        toast.error(msg);
        navigate('/login', { replace: true });
      });
  }, [navigate, params, setAuth]);

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
