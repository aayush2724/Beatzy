import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import PublicShell from '../components/PublicShell';
import { EmptyState } from '../components/ui';

export default function AuthError() {
  return (
    <PublicShell width="max-w-lg" className="flex items-center">
      <EmptyState
        icon={ShieldAlert}
        title="Sign-in didn't complete"
        description="Google sign-in was interrupted or isn't set up on this server. You can try again, or sign in with your email."
        className="w-full"
        action={
          <div className="flex gap-3">
            <Link to="/login" className="btn-primary inline-flex items-center text-sm">Try again</Link>
            <Link to="/" className="btn-secondary inline-flex items-center text-sm">Home</Link>
          </div>
        }
      />
    </PublicShell>
  );
}
