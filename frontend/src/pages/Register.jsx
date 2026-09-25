import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, UserRound } from 'lucide-react';
import { register, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/AuthShell';
import { Button, Input } from '../components/ui';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await register(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Welcome to Beatzy');
      navigate('/upload');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Couldn't create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Identify tracks and read their tempo, key, chords and mood."
      footer={
        <>
          Already have an account? <Link to="/login" className="font-medium text-brand hover:text-brand-hover">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" icon={UserRound} autoComplete="name" required minLength={2} value={form.name} onChange={update('name')} placeholder="Your name" />
        <Input label="Email" type="email" icon={Mail} autoComplete="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
        <Input label="Password" type="password" icon={Lock} autoComplete="new-password" required minLength={8} value={form.password} onChange={update('password')} placeholder="At least 8 characters" />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line-subtle" /> or <span className="h-px flex-1 bg-line-subtle" />
      </div>

      <Button type="button" variant="secondary" onClick={googleLogin} className="w-full">
        Continue with Google
      </Button>

      <p className="text-center text-xs text-ink-faint">
        By creating an account you agree to the{' '}
        <Link to="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{' '}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
