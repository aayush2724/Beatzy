import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpRight, CreditCard, Lock, Mail, UserRound } from 'lucide-react';
import api from '../api/client';
import PageWrapper from '../components/PageWrapper';
import { useAuthStore } from '../store/authStore';
import { Badge, Button, Card, Input, PageHeader, SectionHeader } from '../components/ui';

// Keep in step with the Pricing page.
const PLAN_PRICES = { free: '$0 / month', pro: '$4.99 / month', enterprise: '$19.99 / month' };

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const plan = user?.plan || 'free';

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) return;
    setSavingName(true);
    try {
      const { data } = await api.patch('/api/users/me', { name: name.trim() });
      setUser(data.data);
      toast.success('Name updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Couldn't update your name");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/api/users/me/password', { currentPassword: passwords.current, newPassword: passwords.next });
      toast.success('Password changed');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Couldn't change your password");
    } finally {
      setSavingPw(false);
    }
  }

  async function openBillingPortal() {
    try {
      const { data } = await api.post('/api/billing/portal');
      window.location.href = data.url;
    } catch {
      toast.error("Billing isn't available right now");
    }
  }

  return (
    <PageWrapper className="mx-auto max-w-4xl space-y-8 pb-16">
      <PageHeader
        eyebrow="Account"
        title={
          <span className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand font-display text-2xl font-semibold text-brand-ink">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
            {user?.name}
          </span>
        }
        description={user?.email}
        actions={<Badge variant={plan === 'free' ? 'neutral' : 'brand'} className="capitalize">{plan} plan</Badge>}
      />

      {/* Name */}
      <Card>
        <SectionHeader title="Profile" description="How you appear in the app." />
        <form onSubmit={saveName} className="mt-5 grid gap-4 md:grid-cols-2 md:items-end">
          <Input label="Email" value={user?.email || ''} icon={Mail} disabled hint="Your email is your sign-in and can't be changed here." />
          <div className="flex items-end gap-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} icon={UserRound} required minLength={2} />
            <Button type="submit" disabled={savingName || !name.trim() || name.trim() === user?.name} className="!h-11 !py-0">
              {savingName ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password */}
      <Card>
        <SectionHeader title="Password" description="Use at least 8 characters." />
        <form onSubmit={savePassword} className="mt-5 grid gap-4 md:grid-cols-3">
          <Input label="Current password" type="password" icon={Lock} autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} required />
          <Input label="New password" type="password" icon={Lock} autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} required minLength={8} />
          <Input
            label="Confirm new password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={passwords.confirm}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            required
            minLength={8}
            error={passwords.confirm && passwords.next !== passwords.confirm ? "Doesn't match" : undefined}
          />
          <div className="md:col-span-3">
            <Button type="submit" variant="secondary" disabled={savingPw}>{savingPw ? 'Changing…' : 'Change password'}</Button>
          </div>
        </form>
      </Card>

      {/* Plan */}
      <Card>
        <SectionHeader title="Plan & billing" description="Billing is handled by Stripe." />
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight text-ink capitalize">{plan}</p>
            <p className="mt-1 text-sm text-ink-muted">{PLAN_PRICES[plan] || PLAN_PRICES.free}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {plan !== 'free' && (
              <Button variant="secondary" onClick={openBillingPortal} className="inline-flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Manage billing
              </Button>
            )}
            <Link to="/pricing" className="btn-primary inline-flex items-center gap-2 text-sm">
              {plan === 'enterprise' ? 'View plans' : 'Upgrade'} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
