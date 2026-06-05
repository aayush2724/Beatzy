import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import PageWrapper from '../components/PageWrapper';
import { useAuthStore } from '../store/authStore';
import { 
  Key, 
  Plus, 
  X, 
  Copy, 
  ShieldCheck, 
  Activity, 
  Database, 
  Cpu, 
  Trash2,
  Terminal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

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
      toast.success('Access node provisioned');
    } catch (err) {
      toast.error('Provisioning failed');
    } finally { setCreating(false); }
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this access node? This action is permanent and will terminate all active uplinks.')) return;
    try {
      await api.delete(`/api/keys/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Node revoked');
    } catch (err) { toast.error('Revocation protocol failed'); }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key);
    toast.success('Credential copied to buffer');
  }

  if (!canUseApiKeys) return (
    <PageWrapper className="flex items-center justify-center py-24 animate-page-entrance">
      <div className="max-w-xl w-full text-center glass-card p-16 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <ShieldAlert className="w-64 h-64 text-[#8b2e5f]" />
        </div>
        <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 bg-white/[0.03] border border-white/10 group-hover:border-[#8b2e5f]/30 transition-colors">
          <ShieldAlert className="w-10 h-10 text-[#8b2e5f] opacity-70" />
        </div>
        <h2 className="text-4xl font-display font-black text-white mb-4 uppercase tracking-tight">Access Restricted</h2>
        <p className="font-mono text-[10px] text-white/30 mb-12 uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">Upgrade to a professional tier to provision secure API credentials for high-frequency neural mapping.</p>
        <Link to="/pricing" className="group flex items-center justify-center gap-4 h-16 w-full rounded-2xl bg-[#8b2e5f] text-white font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-[0_0_50px_rgba(139,46,95,0.2)]">
          <Cpu className="w-5 h-5 fill-current" />
          <span>Upgrade Protocol</span>
        </Link>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper className="space-y-16 pb-20 animate-page-entrance">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e8a084]/20 bg-[#e8a084]/5 text-[#e8a084] font-mono text-[9px] uppercase tracking-[0.2em]">
              <Key className="w-3 h-3" /> Credential Matrix
          </div>
          <h1 className="text-6xl font-display font-black text-white tracking-tighter uppercase leading-none">API <span className="text-[#e8a084] text-glow-wine">Matrix</span></h1>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">Programmatic interface for audio intelligence uplinks</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="group flex items-center gap-4 px-10 py-5 rounded-2xl bg-[#e8a084] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(232,160,132,0.2)] hover:scale-105 transition-all">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'CANCEL' : 'PROVISION NODE'}
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-8 space-y-12">
          {newKey && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="glass-card p-10 relative overflow-hidden border-[#c41e3a]/20 bg-[#c41e3a]/5">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#c41e3a]" />
              <div className="flex items-center gap-3 mb-6 text-[#c41e3a]">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]">Credential Provisioned Successfully</span>
              </div>
              <p className="font-mono text-[10px] text-white/40 mb-8 uppercase tracking-widest leading-relaxed">Store this secret key securely. For system integrity, it will not be displayed again.</p>
              <div className="flex items-center justify-between gap-6 p-6 rounded-2xl bg-black/60 border border-white/10 shadow-inner group/key">
                <code className="font-mono text-base text-[#c41e3a] select-all truncate">{newKey}</code>
                <button onClick={() => copyKey(newKey)} className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-[#c41e3a]/50 text-white/20 hover:text-[#c41e3a] transition-all group-hover/key:scale-105">
                    <Copy className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {showForm && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="obsidian-panel p-10 rounded-[2.5rem] border border-[#e8a084]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Terminal className="w-24 h-24 text-[#e8a084]" />
              </div>
              <h3 className="font-display font-black text-xs text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-[#e8a084]" /> Initialize New Node
              </h3>
              <form onSubmit={createKey} className="flex flex-col md:flex-row gap-6">
                <input 
                    className="flex-1 h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-[#e8a084]/30 transition-all font-medium" 
                    placeholder="Node Identifier (e.g. Production Cluster)" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    required 
                />
                <button type="submit" disabled={creating} className="h-16 px-12 rounded-2xl bg-[#e8a084] text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(232,160,132,0.15)] disabled:opacity-50">
                  {creating ? 'AUTHORIZING...' : 'AUTHORIZE NODE'}
                </button>
              </form>
            </motion.div>
          )}

          <div className="space-y-6">
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] ml-1">Active Neural Access Nodes</p>
            
            {loading ? (
              <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-[2rem] animate-pulse obsidian-panel" />)}</div>
            ) : keys.length > 0 ? (
                <div className="space-y-4">
                    {keys.map(key => (
                        <div key={key.id} className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 rounded-[2.5rem] obsidian-panel border border-white/5 hover:border-[#e8a084]/20 transition-all group relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-1 h-full bg-[#e8a084]/20 group-hover:bg-[#e8a084] transition-colors" />
                            
                            <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex items-center gap-4">
                                    <h4 className="text-xl font-display font-black text-white uppercase tracking-tight truncate">{key.name}</h4>
                                    <div className="px-3 py-1 rounded-lg font-mono text-[8px] font-black uppercase tracking-widest bg-[#c41e3a]/10 border border-[#c41e3a]/20 text-[#c41e3a]">ACTIVE</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#e8a084] animate-pulse" />
                                    <code className="font-mono text-[11px] text-white/30 tracking-widest">{key.key_prefix}••••••••••••••••</code>
                                </div>
                            </div>

                            <div className="flex gap-12 shrink-0 px-8 border-l border-white/5">
                                <div>
                                    <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Invocations</p>
                                    <p className="font-display font-black text-lg text-white">{key.request_count?.toLocaleString() ?? '0'}</p>
                                </div>
                                <div>
                                    <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Last Uplink</p>
                                    <p className="font-display font-black text-lg text-white">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : '—'}</p>
                                </div>
                            </div>

                            <button onClick={() => revokeKey(key.id)} className="w-14 h-14 flex items-center justify-center rounded-2xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="p-20 rounded-[3rem] text-center obsidian-panel border border-dashed border-white/5">
                <Key className="mx-auto w-12 h-12 text-white/10 mb-6" />
                <h4 className="font-display font-black text-lg text-white/20 uppercase tracking-[0.3em]">No active nodes detected</h4>
              </div>
            )}
          </div>
        </div>

        <aside className="xl:col-span-4 space-y-12">
            <section className="glass-card overflow-hidden border-white/10 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <span className="font-mono text-[9px] text-white/40 flex items-center gap-3 uppercase tracking-[0.2em] font-black">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c41e3a] animate-pulse" />
                        Query Terminal
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText('curl -X POST https://api.beatzy.io/api/audio/upload -H "X-API-Key: YOUR_KEY" -F "audio=@song.mp3"'); toast.success('Copied to buffer'); }} className="text-white/20 hover:text-[#c41e3a] transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-8 overflow-x-auto bg-black/40">
                    <pre className="font-mono text-[10px] leading-relaxed">
                        <span className="text-white/60 font-bold">curl</span><span className="text-white/20"> -X POST </span><span className="text-[#c41e3a] font-black">api.beatzy.io</span><span className="text-white/20">/upload \{'\n'}</span>
                        <span className="text-white/20">  -H </span><span className="text-[#e8a084] font-black">"X-API-Key: YOUR_NODE_KEY"</span><span className="text-white/20"> \{'\n'}</span>
                        <span className="text-white/20">  -F </span><span className="text-[#f4a460] font-black">"audio=@spectral_data.mp3"</span>
                    </pre>
                </div>
            </section>

            <section className="obsidian-panel p-10 rounded-[3rem] border border-white/5 space-y-10">
                <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">Technical Documentation</p>
                <ul className="space-y-4">
                    {[
                        { label: 'Uplink Authentication', icon: ShieldCheck, color: 'text-[#e8a084]' },
                        { label: 'Neural Bandwidth', icon: Activity, color: 'text-[#c41e3a]' },
                        { label: 'SDK V4.2 Protocol', icon: Terminal, color: 'text-[#f4a460]' }
                    ].map(doc => (
                        <li key={doc.label}>
                            <a href={`${import.meta.env.VITE_API_URL || ''}/api/docs`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl transition-all group border border-white/5 hover:border-white/20 hover:bg-white/[0.03]">
                                <div className="flex items-center gap-4">
                                    <doc.icon className={`w-4 h-4 ${doc.color}`} />
                                    <span className="font-display font-black text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{doc.label}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/10 group-hover:translate-x-1 group-hover:text-[#c41e3a] transition-all" />
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </aside>
      </div>

      {/* Technical Footer Decoration */}
      <div className="flex justify-between items-center pt-20 font-mono text-[8px] text-white/10 uppercase tracking-[0.4em] select-none">
            <div className="flex items-center gap-4">
                <div className="w-1 h-1 rounded-full bg-[#e8a084] animate-pulse" />
                API Matrix Synchronized
            </div>
            <div>Uplink Status: Encrypted (AES-256)</div>
            <div className="flex items-center gap-2">
                <Database className="w-2 h-2" />
                Cluster Node: 0x9081X
            </div>
        </div>
    </PageWrapper>
  );
}
