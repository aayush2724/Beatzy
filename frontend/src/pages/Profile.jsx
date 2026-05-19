import { useState } from 'react';
import { User, Lock, CreditCard, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e) {
    e.preventDefault();
    setSavingName(true);
    try {
      const { data } = await api.patch('/api/users/me', { name });
      setUser(data.data);
      toast.success('Name updated');
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      await api.patch('/api/users/me/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success('Password updated');
      setPasswords({ current: '', new: '', confirm: '' });
    } finally {
      setSavingPw(false);
    }
  }

  async function openBillingPortal() {
    try {
      const { data } = await api.post('/api/billing/portal');
      window.location.href = data.data.url;
    } catch {
      toast.error('No active subscription');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <User size={18} className="text-brand-400" />
            <h2 className="font-semibold">Personal Information</h2>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-400">Email</label>
            <input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
          </div>
          <form onSubmit={saveName}>
            <label className="block text-sm font-medium mb-2">Display name</label>
            <div className="flex gap-3">
              <input className="input" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
              <button type="submit" className="btn-primary shrink-0" disabled={savingName}>
                {savingName ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={18} className="text-brand-400" />
            <h2 className="font-semibold">Change Password</h2>
          </div>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current password</label>
              <input type="password" className="input" value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New password</label>
              <input type="password" className="input" value={passwords.new} minLength={8}
                onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm new password</label>
              <input type="password" className="input" value={passwords.confirm} minLength={8}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-primary" disabled={savingPw}>
              {savingPw ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-brand-400" />
            <h2 className="font-semibold">Subscription</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{user?.plan} plan</p>
              <p className="text-sm text-gray-400">Manage billing, invoices, and plan changes</p>
            </div>
            <button onClick={openBillingPortal} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
              Manage billing <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
