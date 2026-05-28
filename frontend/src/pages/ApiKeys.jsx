import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ApiKeys() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const canUseApiKeys = ['pro', 'enterprise'].includes(user?.plan);

  useEffect(() => {
    if (!canUseApiKeys) {
      setLoading(false);
      return;
    }
    api.get('/api/keys')
      .then(({ data }) => setKeys(data.data))
      .catch((err) => toast.error(err.message || 'Failed to fetch API keys'))
      .finally(() => setLoading(false));
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
      toast.success('Programmatic API Key authorized!');
    } catch (err) {
      toast.error(err.message || 'Key authorization failure');
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this API key? This action is absolute and cannot be undone.')) return;
    try {
      await api.delete(`/api/keys/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Key revoked successfully');
    } catch (err) {
      toast.error(err.message || 'Key revocation failed');
    }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to secure clipboard!');
  }

  if (!canUseApiKeys) return (
    <div className="flex items-center justify-center py-20 px-6">
      <div className="max-w-xl w-full text-center glass-panel rounded-xl p-8 md:p-12 border border-glass-border">
        <div className="w-16 h-16 bg-white/[0.02] border border-glass-border rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-outline text-3xl">lock</span>
        </div>
        <h2 className="font-headline text-2xl font-extrabold text-white tracking-tight mb-3">API Console Restricted</h2>
        <p className="text-on-surface-variant text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Upgrade your alignment matrix to Pro or Enterprise protocols to provision secure API keys.
        </p>
        <Link to="/pricing" className="inline-flex items-center justify-center bg-sonic-lime text-black font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 rounded hover:bg-sonic-lime/90 active:scale-95 transition-all">
          Upgrade Protocol
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-gutter pb-16">
      {/* Header and Controls */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight">API Key Matrix</h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Programmatic access to our high-frequency audio analysis and stem alignment engines.
          </p>
        </div>
        <button 
          onClick={() => setShowForm((current) => !current)} 
          className="bg-sonic-lime text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 rounded hover:bg-sonic-lime/90 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(215,255,90,0.15)] shrink-0 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          Provision Key
        </button>
      </header>

      {/* Main Developer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Section: Active Keys & Success Indicators */}
        <div className="lg:col-span-8 space-y-gutter">
          {/* New Key Showcase Banner */}
          {newKey && (
            <div className="glass-panel border-sonic-lime/30 p-6 rounded-xl relative overflow-hidden bg-sonic-lime/[0.02]">
              <div className="absolute top-0 left-0 w-1 h-full bg-sonic-lime"></div>
              <div className="flex items-center gap-2.5 mb-3 text-sonic-lime">
                <span className="material-symbols-outlined text-base">verified</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Key Provisioned Successfully</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-5 leading-relaxed">
                Make sure to copy your credentials below. For security purposes, this value will not be shown again.
              </p>
              <div className="bg-[#0c0c0c] p-4 rounded border border-glass-border flex items-center justify-between group">
                <code className="font-mono text-xs text-white select-all truncate mr-4">{newKey}</code>
                <button 
                  onClick={() => copyKey(newKey)} 
                  className="material-symbols-outlined text-on-surface-variant hover:text-sonic-lime transition-colors text-sm"
                  type="button"
                >
                  content_copy
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-on-surface-variant/50">
                <span className="material-symbols-outlined text-xs">warning</span>
                NEVER INTEGRATE PRIVATE API CREDENTIALS INTO FRONTEND REPOSITORIES.
              </div>
            </div>
          )}

          {/* Create Key Form */}
          {showForm && (
            <div className="glass-panel p-6 rounded-xl border border-glass-border bg-white/[0.01]">
              <h3 className="font-headline text-base font-bold text-white mb-4">Provision Key Credentials</h3>
              <form onSubmit={createKey} className="flex flex-col md:flex-row gap-3">
                <input 
                  className="bg-[#0c0c0c] border border-glass-border rounded px-4 py-2.5 text-xs text-white outline-none focus:border-sonic-lime flex-grow placeholder:text-on-surface-variant/40" 
                  placeholder="Scope Identifier (e.g. Production Web Core)" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  required 
                />
                <button 
                  type="submit" 
                  className="bg-sonic-lime text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded hover:bg-sonic-lime/90 active:scale-95 transition-all shrink-0" 
                  disabled={creating}
                >
                  {creating ? 'Authorizing...' : 'Authorize'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="border border-glass-border text-on-surface-variant font-mono text-[10px] uppercase tracking-wider px-5 py-2.5 rounded hover:bg-white/5 transition-all shrink-0"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Keys Listing Grid */}
          <div className="space-y-4">
            <h3 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Active Keys</h3>

            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="glass-panel p-6 rounded-lg h-24 animate-pulse border border-glass-border" />
                ))}
              </div>
            ) : keys.length > 0 ? (
              keys.map((key, index) => (
                <div 
                  key={key.id} 
                  className="glass-panel hover:bg-white/[0.01] transition-colors p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-2 border-l-sonic-lime border border-glass-border"
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="font-headline font-bold text-sm text-white truncate max-w-xs">{key.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-sonic-lime/10 border border-sonic-lime/20 text-sonic-lime text-[8px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <code className="text-xs font-mono text-on-surface-variant">{key.key_prefix}••••••••</code>
                  </div>
                  <div className="flex gap-8 text-center shrink-0">
                    <div>
                      <p className="text-[8px] font-mono text-on-surface-variant uppercase tracking-widest mb-0.5">Telemetry Calls</p>
                      <p className="text-sm font-mono font-bold text-white">{key.request_count?.toLocaleString() ?? '0'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-on-surface-variant uppercase tracking-widest mb-0.5">Last Call</p>
                      <p className="text-sm font-mono font-bold text-white">{key.last_used_at ? new Date(key.last_used_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Never'}</p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button 
                      onClick={() => revokeKey(key.id)} 
                      className="w-9 h-9 flex items-center justify-center rounded border border-glass-border hover:border-red-500/30 text-on-surface-variant hover:text-red-400 hover:bg-red-500/5 transition-all" 
                      title="Revoke Credentials"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel p-10 rounded-xl border border-glass-border text-center">
                <div className="w-14 h-14 bg-white/[0.02] border border-glass-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl text-outline">key</span>
                </div>
                <h4 className="font-headline text-base font-bold text-white mb-1.5">No Active API Credentials</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                  Provision a secure key identifier to initiate pipeline queries programmatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Docs and Interactive Shell Code block */}
        <aside className="lg:col-span-4 space-y-gutter">
          <div className="bg-[#0a0a0a] border border-glass-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#131313]/60 border-b border-glass-border">
              <span className="font-mono text-[9px] text-on-surface-variant flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse"></span>
                cURL Matrix Query
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('curl -X POST https://api.beatzy.io/api/audio/upload -H "X-API-Key: YOUR_API_KEY" -F "audio=@song.mp3"');
                  toast.success('cURL pipeline command copied!');
                }}
                className="material-symbols-outlined text-on-surface-variant hover:text-sonic-lime text-sm" 
                type="button"
              >
                content_copy
              </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <pre className="font-mono text-[10px] leading-relaxed text-prism-violet">
                <span className="text-white">curl</span> -X POST https://api.beatzy.io/api/audio/upload \<br />
                &nbsp;&nbsp;-H <span className="text-sonic-lime">"X-API-Key: YOUR_API_KEY"</span> \<br />
                &nbsp;&nbsp;-F <span className="text-sonic-lime">"audio=@song.mp3"</span>
              </pre>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-glass-border">
            <h3 className="font-mono text-[9px] text-on-surface-variant mb-4 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-sonic-lime">menu_book</span>
              Interactive Reference
            </h3>
            <ul className="space-y-3 font-sans text-xs">
              {[
                'Signal Core Credentials',
                'API Bandwidth & Quotas',
                'Synthesizer Reference SDK',
              ].map((doc) => (
                <li key={doc}>
                  <a className="flex items-center justify-between p-2 rounded hover:bg-white/[0.02] text-on-surface-variant hover:text-white transition-colors group" href="#">
                    <span>{doc}</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:translate-x-1 transition-all">arrow_forward</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
