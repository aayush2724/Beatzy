import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuthStore } from '../store/authStore';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  const token = useAuthStore((s) => s.token);
  const { pathname } = useLocation();
  usePageMeta({ title: 'Page not found', description: 'That page does not exist on Beatzy.', noindex: true });

  return (
    <PublicShell width="max-w-lg" className="flex items-center">
      <EmptyState
        icon={Compass}
        titleAs="h1"
        title="Page not found"
        description={`There is nothing at ${pathname}. The link may have moved, or the address has a typo.`}
        className="w-full"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary inline-flex items-center text-sm">Back to home</Link>
            {token ? (
              <Link to="/dashboard" className="btn-secondary inline-flex items-center text-sm">Open the app</Link>
            ) : (
              <Link to="/register" className="btn-secondary inline-flex items-center text-sm">Create an account</Link>
            )}
          </div>
        }
      />
    </PublicShell>
  );
}
