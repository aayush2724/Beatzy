import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Welcome back');
      await new Promise((r) => setTimeout(r, 0));
      navigate('/upload', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your dashboard, upload history, and analysis results."
      footer={
        <p className="text-center text-xs tracking-[0.08em] text-gray-600 uppercase">
          Encrypted session · JWT refresh
        </p>
      }
    >
      <button
        type="button"
        onClick={googleLogin}
        className="btn-secondary w-full flex items-center justify-center gap-3 py-4 text-sm"
      >
        <svg height="20" viewBox="0 0 24 24" width="20" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-gray-500 uppercase tracking-widest">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs tracking-[0.12em] uppercase text-gray-400 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="input py-4 text-base"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="text-xs tracking-[0.12em] uppercase text-gray-400">
              Password
            </label>
            <span className="text-xs text-gray-500">Forgot password soon</span>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Your password"
              required
              autoComplete="current-password"
              className="input py-4 pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm uppercase tracking-[0.12em]">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400">
        New to Beatzy?{' '}
        <Link to="/register" className="text-white font-medium hover:underline underline-offset-4">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
