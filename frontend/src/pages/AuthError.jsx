import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { EmptyState } from '../components/ui';

export default function AuthError() {
  usePageMeta({ title: 'Sign-in failed', noindex: true });
  return (
    <PublicShell width="max-w-lg" className="flex items-center">
      <EmptyState
        icon={ShieldAlert}
        titleAs="h1"
        title="Sign-in didn't complete"
        description="Google sign-in was interrupted or isn't set up on this server. You can try again, or sign in with your email."
        className="w-full"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-primary inline-flex items-center text-sm">Try again</Link>
            <Link to="/" className="btn-secondary inline-flex items-center text-sm">Home</Link>
          </div>
        }
      />
    </PublicShell>
  );
}
