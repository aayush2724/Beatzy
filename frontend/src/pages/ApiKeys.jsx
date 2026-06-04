import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import PageWrapper from '../components/PageWrapper';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

export default function ApiKeys() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [creating, setCreating] = useState(false);

  const canUseApiKeys = user?.plan === 'pro' || user?.plan === 'enterprise' || user?.is_admin;

  useEffect(() => {
    if (canUseApiKeys) {
      api.get('/api/keys')
        .then(({ data }) => setKeys(data.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [canUseApiKeys]);

  async function createKey(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/api/keys', { name: newName });
      setNewKey(data.data.key);
      setKeys(prev => [data.data, ...prev]);
      setNewName('');
      setShowForm(false);
      toast.success('Key Authorized', { style: { background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)' } });
    } catch (err) {
      toast.error('Authorization failed');
    } finally { setCreating(false); }
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this access key? This action is permanent.')) return;
    try {
      await api.delete(`/api/keys/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Key Revoked');
    } catch (err) { toast.error('Revocation failure'); }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard', { style: { background: 'var(--color-surface-container)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)' } });
  }

  if (!canUseApiKeys) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-24 px-6">
      <div className="max-w-md w-full text-center glass-panel p-12 border border-white/5 shadow-2xl">
        <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 bg-white/[0.03] border border-white/10">
          <span className="material-symbols-outlined text-white/10 text-4xl">lock</span>
        </div>
        <h2 className="text-3xl font-headline font-extrabold text-white mb-4" style={SG}>Access Restricted</h2>
        <p className="font-mono text-[10px] text-white/30 mb-10 uppercase tracking-[0.2em] leading-relaxed">Upgrade to a professional tier to provision secure API keys for programmatic neural mapping.</p>
        <Link to="/pricing" className="btn-primary w-full flex items-center justify-center gap-3 py-4">
          <span className="material-symbols-outlined text-sm">bolt</span>
          <span className="uppercase tracking-[0.2em] font-extrabold text-xs">Upgrade Protocol</span>
        </Link>
      </div>
    </motion.div>
  );

  return (
    <PageWrapper className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
        <div>
          <h1 className="text-5xl font-headline font-extrabold text-white tracking-tighter" style={SG}>API Matrix</h1>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] mt-3">Programmatic interface for high-frequency audio intelligence</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn-primary flex items-center gap-3 px-8 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
          <span className="uppercase tracking-widest font-extrabold text-xs">{showForm ? 'CANCEL' : 'PROVISION KEY'}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          {newKey && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="glass-panel p-8 relative overflow-hidden border-primary/20 bg-primary/5">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-center gap-3 mb-4 text-primary">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.3em]">Key Provisioned Successfully</span>
              </div>
              <p className="font-mono text-[10px] text-white/40 mb-6 uppercase tracking-wider">Store this credential securely. It will not be displayed again.</p>
              <div className="flex items-center justify-between gap-4 p-5 rounded-xl bg-black/60 border border-white/10 shadow-inner">
                <code className="font-mono text-sm text-white select-all truncate">{newKey}</code>
                <button onClick={() => copyKey(newKey)} className="material-symbols-outlined text-white/20 hover:text-primary transition-colors text-lg flex-shrink-0">content_copy</button>
              </div>
            </motion.div>
          )}

          {showForm && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 border border-primary/10">
              <h3 className="font-bold text-xs text-white uppercase tracking-[0.3em] mb-6">Initialize New Credential</h3>
              <form onSubmit={createKey} className="flex flex-col md:flex-row gap-4">
                <input className="input" placeholder="Identifier (e.g. Production Cluster)" value={newName} onChange={e => setNewName(e.target.value)} required />
                <button type="submit" disabled={creating} className="btn-primary shrink-0 px-10 uppercase tracking-widest font-bold text-xs">
                  {creating ? 'AUTHORIZING...' : 'AUTHORIZE'}
                </button>
              </form>
            </motion.div>
          )}

          <div className="space-y-4">
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6">Active Access Nodes</p>
            {loading ? (
              <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse glass-panel bg-white/[0.01]" />)}</div>
            ) : keys.length > 0 ? keys.map(key => (
              <div key={key.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl glass-panel border-l-4 border-l-primary hover:bg-white/[0.01] transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-base text-white truncate" style={SG}>{key.name}</h4>
                    <span className="px-2 py-0.5 rounded font-mono text-[8px] font-extrabold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">ACTIVE</span>
                  </div>
                  <code className="font-mono text-xs text-white/20 tracking-tighter">{key.key_prefix}••••••••••••••••</code>
                </div>
                <div className="flex gap-10 text-center shrink-0">
                    <div>
                        <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Invocations</p>
                        <p className="font-mono text-sm font-bold text-white">{key.request_count?.toLocaleString() ?? '0'}</p>
                    </div>
                    <div>
                        <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Last Seen</p>
                        <p className="font-mono text-sm font-bold text-white">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : '—'}</p>
                    </div>
                </div>
                <button onClick={() => revokeKey(key.id)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 hover:border-red-500/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            )) : (
              <div className="p-16 rounded-[2rem] text-center glass-panel border-dashed bg-transparent border-white/5">
                <span className="material-symbols-outlined text-4xl text-white/5 mb-4">key</span>
                <h4 className="font-bold text-sm text-white/20 uppercase tracking-[0.3em]">No active credentials found</h4>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
            <section className="glass-panel overflow-hidden border-glass-border shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                    <span className="font-mono text-[9px] text-white/40 flex items-center gap-3 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Query Prototype
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText('curl -X POST https://api.beatzy.io/api/audio/upload -H "X-API-Key: YOUR_KEY" -F "audio=@song.mp3"'); toast.success('Copied!'); }} className="material-symbols-outlined text-white/20 hover:text-primary transition-colors text-base">content_copy</button>
                </div>
                <div className="p-6 overflow-x-auto bg-black/40">
                    <pre className="font-mono text-[10px] leading-relaxed">
                        <span className="text-white/60">curl</span><span className="text-white/30"> -X POST </span><span className="text-primary/70 font-bold">api.beatzy.io</span><span className="text-white/30">/upload \{'\n'}</span>
                        <span className="text-white/30">  -H </span><span className="text-primary/80">"X-API-Key: ..."</span><span className="text-white/30"> \{'\n'}</span>
                        <span className="text-white/30">  -F </span><span className="text-primary/80">"audio=@file.mp3"</span>
                    </pre>
                </div>
            </section>

            <section className="glass-panel p-8">
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] mb-8">Documentation</p>
                <ul className="space-y-3">
                    {['Pipeline Authentication', 'Bandwidth Quotas', 'Neural SDK v4'].map(doc => (
                        <li key={doc}>
                            <a href={`${import.meta.env.VITE_API_URL || ''}/api/docs`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl transition-all group border border-white/5 hover:border-white/10 hover:bg-white/[0.02]">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors font-bold">{doc}</span>
                                <span className="material-symbols-outlined text-base text-white/10 group-hover:translate-x-1 group-hover:text-primary transition-all">arrow_forward</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </aside>
      </div>
    </PageWrapper>
  );
}
