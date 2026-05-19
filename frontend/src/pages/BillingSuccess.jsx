import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function BillingSuccess() {
  const [params] = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    setTimeout(() => {
      getMe().then(({ data }) => setUser(data.data.user)).catch(() => {});
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="card text-center max-w-md w-full py-12">
        <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">You're all set!</h1>
        <p className="text-gray-400 mb-8">Your subscription is now active. Enjoy full access to Beatzy.</p>
        <Link to="/dashboard" className="btn-primary px-8">Go to dashboard</Link>
      </div>
    </div>
  );
}
