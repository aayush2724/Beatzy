import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Wordmark } from '../components/PublicShell';
import { Badge, Card, Progress } from '../components/ui';

export default function BillingSuccess() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [synced, setSynced] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Stripe's webhook updates the plan a moment after redirecting here, so
  // give it a beat before reading the profile back.
  useEffect(() => {
    const sync = window.setTimeout(() => {
      getMe()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => {})
        .finally(() => setSynced(true));
    }, 2000);
    return () => window.clearTimeout(sync);
  }, [setUser]);

  useEffect(() => {
    if (!synced) return;
    const id = window.setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          window.clearInterval(id);
          navigate('/dashboard');
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [synced, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <nav className="mx-auto flex h-16 w-full max-w-[90rem] items-center px-5 sm:px-8"><Wordmark /></nav>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <Card padding="lg" className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok/10 text-ok">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Payment confirmed</h1>
            <p className="mt-2 text-sm text-ink-muted">{synced ? 'Your account is up to date.' : 'Updating your account…'}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            Plan <Badge variant="brand" className="capitalize">{user?.plan || 'updating'}</Badge>
          </div>
          <Progress value={synced ? 100 : 40} tone="ok" />
          <div className={synced ? 'space-y-3 transition-opacity' : 'space-y-3 opacity-0 transition-opacity'}>
            <Link to="/dashboard" className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-ink-faint">Redirecting in {countdown}s</p>
          </div>
        </Card>
      </main>
    </div>
  );
}
