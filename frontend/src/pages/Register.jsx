import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, UserRound } from 'lucide-react';
import { register, googleLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { usePageMeta } from '../hooks/usePageMeta';
import AuthShell from '../components/AuthShell';
import { Button, Input } from '../components/ui';
import { fieldErrorsFrom } from '../lib/formErrors';

const MIN_PASSWORD = 8;

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  usePageMeta({
    title: 'Create an account',
    description: 'Create a free Beatzy account to identify tracks and read their tempo, key, chords and mood.',
  });

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  function validate() {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Enter at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (form.password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      const { data } = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Welcome to Beatzy');
      navigate('/upload');
    } catch (err) {
      const status = err.response?.status;
      const fields = fieldErrorsFrom(err);
      setFieldErrors(fields);
      if (status === 409) setFieldErrors({ email: 'An account with this email already exists. Try signing in.' });
      else if (status === 429) setFormError('Too many attempts. Please wait a few minutes and try again.');
      else if (!Object.keys(fields).length) setFormError(status ? 'Couldn’t create your account. Please try again.' : 'Couldn’t reach the server. Check your connection and try again.');
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
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading} noValidate>
        {formError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </p>
        )}
        <Input label="Name" name="name" icon={UserRound} autoComplete="name" required minLength={2} value={form.name} onChange={update('name')} placeholder="Your name" error={fieldErrors.name} />
        <Input label="Email" name="email" type="email" icon={Mail} autoComplete="email" inputMode="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" error={fieldErrors.email} />
        <Input
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={form.password}
          onChange={update('password')}
          placeholder={`At least ${MIN_PASSWORD} characters`}
          hint={`At least ${MIN_PASSWORD} characters. A passphrase is easier to remember than symbols.`}
          error={fieldErrors.password}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-ink-faint" aria-hidden="true">
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
