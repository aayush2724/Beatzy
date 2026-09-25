import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import PublicShell from '../components/PublicShell';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <PublicShell width="max-w-lg" className="flex items-center">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That link doesn't lead anywhere. It may have moved, or the address has a typo."
        className="w-full"
        action={
          <div className="flex gap-3">
            <Link to="/" className="btn-primary inline-flex items-center text-sm">Home</Link>
            <Link to="/upload" className="btn-secondary inline-flex items-center text-sm">Analyze a track</Link>
          </div>
        }
      />
    </PublicShell>
  );
}
