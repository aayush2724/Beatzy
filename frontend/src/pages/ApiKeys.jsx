import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
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
    if (!canUseApiKeys) { setLoading(false); return; }
    api.get('/api/keys').then(({ data }) => setKeys(data.data)).finally(() => setLoading(false));
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
      toast.success('API key created!');
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this API key? It cannot be undone.')) return;
    await api.delete(`/api/keys/${id}`);
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success('Key revoked');
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard');
  }

  const visibleKeys = keys.slice(0, 2);

  if (!canUseApiKeys) return (
    <div className="min-h-screen bg-deep-obsidian text-on-surface overflow-x-hidden font-body-md text-body-md">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-primary-container via-transparent to-primary-container"></div>
      <main className="relative z-10 min-h-screen flex items-center justify-center px-margin-mobile md:px-margin-desktop">
        <div className="max-w-xl w-full text-center glass-card rounded-xl p-8 md:p-12 success-glow">
          <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={30} className="text-outline" />
          </div>
          <h1 className="font-headline-lg text-headline-lg mb-3">API Access requires Pro</h1>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">Upgrade to Pro or Enterprise to get API keys and integrate Beatzy into your apps.</p>
          <Link to="/pricing" className="inline-flex items-center justify-center bg-sonic-lime text-deep-obsidian font-label-md px-6 py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all">
            View plans
          </Link>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-deep-obsidian text-on-surface overflow-x-hidden font-body-md text-body-md">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0e0e0e; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .glass-card {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .technical-gradient {
          background: linear-gradient(135deg, rgba(160, 71, 249, 0.05) 0%, rgba(215, 255, 90, 0.05) 100%);
        }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-glass-border shadow-[0_0_20px_rgba(0,245,255,0.05)] flex justify-between items-center px-margin-desktop py-4">
        <div className="font-display-lg text-headline-md tracking-tighter text-neon-cyan">Beatzy AI</div>
        <nav className="hidden md:flex gap-8">
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/">Main Stage</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/artist-echoes">Inside the Wave</Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/artist-echoes">Artist Echoes</Link>
          <Link className="font-body-md text-body-md text-neon-cyan border-b-2 border-neon-cyan pb-1 transition-all" to="/pricing">Production Suite</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-neon-cyan transition-colors">account_circle</button>
        </div>
      </header>

      <aside className="fixed left-0 top-0 h-full w-[280px] z-40 bg-deep-obsidian/90 backdrop-blur-lg border-r border-glass-border hidden md:flex flex-col pt-24 pb-8">
        <div className="px-8 mb-12">
          <h2 className="font-headline-md text-neon-cyan mb-1">Operator</h2>
          <p className="font-label-sm text-label-sm text-outline opacity-50 uppercase tracking-widest">v2.4.0-Stable</p>
        </div>
        <nav className="flex-1">
          <ul className="space-y-1">
            <li><Link className="flex items-center gap-4 px-8 py-3 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 active:translate-x-1 transition-all" to="/dashboard"><span className="material-symbols-outlined">dashboard</span><span className="font-label-sm text-label-md">Dashboard</span></Link></li>
            <li><Link className="flex items-center gap-4 px-8 py-3 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 active:translate-x-1 transition-all" to="/artist-echoes"><span className="material-symbols-outlined">analytics</span><span className="font-label-sm text-label-md">Spectral</span></Link></li>
            <li><Link className="flex items-center gap-4 px-8 py-3 text-neon-cyan bg-primary-container/10 border-r-4 border-neon-cyan active:translate-x-1 transition-all" to="/upload"><span className="material-symbols-outlined">mic_external_on</span><span className="font-label-sm text-label-md">Studio</span></Link></li>
            <li><Link className="flex items-center gap-4 px-8 py-3 text-outline hover:text-on-surface-variant hover:bg-surface-variant/30 active:translate-x-1 transition-all" to="/results"><span className="material-symbols-outlined">library_music</span><span className="font-label-sm text-label-md">Library</span></Link></li>
          </ul>
        </nav>
      </aside>

      <main className="md:ml-[280px] pt-24 min-h-screen px-margin-mobile md:px-margin-desktop pb-20">
        <div className="max-w-container-max mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">API Keys</h1>
              <p className="text-on-surface-variant max-w-xl">Programmatic access to Beatzy's synthesis and audio analysis engine. Keep your keys secure and scoped to specific environments.</p>
            </div>
            <button onClick={() => setShowForm((current) => !current)} className="bg-sonic-lime text-deep-obsidian font-label-md text-label-md px-6 py-3 rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New Key
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-8 space-y-gutter">
              <div className={`${newKey ? 'block' : 'hidden'} glass-card border-sonic-lime/30 p-6 rounded-xl relative overflow-hidden`} id="newKeySuccess">
                <div className="absolute top-0 left-0 w-1 h-full bg-sonic-lime"></div>
                <div className="flex items-center gap-3 mb-4 text-sonic-lime">
                  <span className="material-symbols-outlined">verified</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider">New API Key Generated</span>
                </div>
                <p className="text-body-md text-on-surface-variant mb-6">This key will only be shown once. If you lose it, you will need to revoke it and generate a new one.</p>
                <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant flex items-center justify-between group">
                  <code className="font-label-md text-label-md text-on-surface select-all truncate">{newKey || 'btz_live_6uV9fKx8r2Pz4m0NqW5T'}</code>
                  <button onClick={() => copyKey(newKey || '')} className="material-symbols-outlined text-outline hover:text-sonic-lime transition-colors" type="button">content_copy</button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-label-sm font-label-sm text-outline">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  NEVER SHARE THIS KEY IN PUBLIC REPOSITORIES.
                </div>
              </div>

              {showForm && (
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="font-headline-lg text-headline-lg mb-4">Create new API key</h3>
                  <form onSubmit={createKey} className="flex flex-col md:flex-row gap-3">
                    <input className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none focus:border-sonic-lime flex-1" placeholder="Key name (e.g. Production, My App)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                    <button type="submit" className="bg-sonic-lime text-deep-obsidian font-label-md px-6 py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all shrink-0" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                    <button type="button" onClick={() => setShowForm(false)} className="border border-outline-variant text-on-surface-variant font-label-md px-6 py-3 rounded-lg hover:bg-white/5 transition-all shrink-0">Cancel</button>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-label-sm text-label-sm text-outline mb-4 uppercase tracking-widest">Active Production Keys</h3>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, index) => (
                      <div key={index} className="glass-card p-5 rounded-lg h-24 animate-pulse bg-surface-container/60" />
                    ))}
                  </div>
                ) : visibleKeys.length > 0 ? (
                  visibleKeys.map((key, index) => (
                    <div key={key.id} className={`glass-card hover:bg-surface-container-high transition-colors p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-2 ${index === 0 ? 'border-l-prism-violet' : 'border-l-outline'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-label-md text-label-md text-on-surface">{key.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full ${index === 0 ? 'bg-sonic-lime/10 text-sonic-lime' : 'bg-surface-container-highest text-outline'} text-[10px] font-bold uppercase tracking-widest`}>
                            {index === 0 ? 'Active' : 'Staging'}
                          </span>
                        </div>
                        <code className="text-label-sm font-label-sm text-outline">{key.key_prefix}••••••••</code>
                      </div>
                      <div className="flex gap-12 text-center">
                        <div>
                          <p className="text-[10px] font-label-sm text-outline uppercase mb-1">Requests</p>
                          <p className="text-label-md font-label-md text-on-surface">{key.request_count?.toLocaleString?.() ?? key.request_count ?? '0'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-label-sm text-outline uppercase mb-1">Last Used</p>
                          <p className="text-label-md font-label-md text-on-surface">{key.last_used_at ? new Date(key.last_used_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Never'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => revokeKey(key.id)} className="w-10 h-10 flex items-center justify-center rounded hover:bg-error-container/20 text-outline hover:text-error transition-all" title="Revoke Key" type="button">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card p-10 rounded-xl text-center">
                    <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-4xl text-outline">key</span>
                    </div>
                    <h4 className="font-headline-lg text-headline-lg mb-2">No API keys yet</h4>
                    <p className="text-on-surface-variant max-w-sm mx-auto">Create a production or staging key to start integrating the Beatzy API.</p>
                  </div>
                )}

                <div className="relative group mt-8">
                  <div className="glass-card p-12 rounded-xl flex flex-col items-center text-center opacity-40 blur-[2px] transition-all group-hover:blur-0">
                    <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-4xl text-outline">lock</span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg mb-2">Advanced Key Scoping</h3>
                    <p className="text-on-surface-variant max-w-sm">Create granular permissions for different applications and microservices.</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-deep-obsidian/80 backdrop-blur px-8 py-10 border border-glass-border rounded-2xl text-center shadow-2xl max-w-sm">
                      <span className="material-symbols-outlined text-prism-violet text-4xl mb-4">lock</span>
                      <h3 className="font-headline-lg text-headline-lg mb-2">API Access requires Pro</h3>
                      <p className="text-on-surface-variant mb-6 text-body-md">Unlock production-scale throughput, webhook triggers, and custom scopes.</p>
                      <Link to="/pricing" className="w-full inline-flex items-center justify-center border border-prism-violet text-prism-violet font-label-md text-label-md py-3 rounded-lg hover:bg-prism-violet/10 active:scale-95 transition-all">
                        View Pro Protocols
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-surface-container border-b border-outline-variant">
                  <span className="font-label-sm text-label-sm text-outline flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-prism-violet"></span>Quick Start: cURL</span>
                  <button className="material-symbols-outlined text-outline hover:text-on-surface text-[18px]" type="button">content_copy</button>
                </div>
                <div className="p-6 custom-scrollbar overflow-x-auto">
                  <pre className="font-label-sm text-label-sm leading-relaxed text-prism-violet"><span className="text-on-surface">curl</span> -X POST https://api.beatzy.io/api/audio/upload \
  -H <span className="text-sonic-lime">"X-API-Key: YOUR_API_KEY"</span> \
  -F <span className="text-sonic-lime">"audio=@song.mp3"</span></pre>
                </div>
                <div className="p-4 bg-surface-container/30 border-t border-outline-variant">
                  <p className="text-[11px] font-label-sm text-outline leading-tight uppercase">Endpoint: multi-modal synthesis v2</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h3 className="font-label-sm text-label-sm text-outline mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  Resonance Docs
                </h3>
                <ul className="space-y-4">
                  <li><a className="flex items-center justify-between group" href="#"><span className="text-body-md text-on-surface-variant group-hover:text-neon-cyan transition-colors">Authentication Protocols</span><span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-all">arrow_forward</span></a></li>
                  <li><a className="flex items-center justify-between group" href="#"><span className="text-body-md text-on-surface-variant group-hover:text-neon-cyan transition-colors">Rate Limiting & Tiering</span><span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-all">arrow_forward</span></a></li>
                  <li><a className="flex items-center justify-between group" href="#"><span className="text-body-md text-on-surface-variant group-hover:text-neon-cyan transition-colors">SDK Reference (Node.js)</span><span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-all">arrow_forward</span></a></li>
                </ul>
              </div>

              <div className="glass-card p-6 rounded-xl overflow-hidden relative technical-gradient">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-[10px] font-label-sm text-outline uppercase">Total Ingested Data</p>
                    <p className="text-headline-lg font-headline-lg text-on-surface">18.4 TB</p>
                  </div>
                  <div className="text-right"><span className="text-sonic-lime text-label-sm font-label-sm">+12%</span></div>
                </div>
                <div className="flex items-end gap-1 h-20">
                  <div className="flex-1 bg-prism-violet/20 hover:bg-prism-violet/40 transition-colors rounded-t-sm" style={{ height: '40%' }}></div>
                  <div className="flex-1 bg-prism-violet/20 hover:bg-prism-violet/40 transition-colors rounded-t-sm" style={{ height: '60%' }}></div>
                  <div className="flex-1 bg-prism-violet/20 hover:bg-prism-violet/40 transition-colors rounded-t-sm" style={{ height: '45%' }}></div>
                  <div className="flex-1 bg-prism-violet/20 hover:bg-prism-violet/40 transition-colors rounded-t-sm" style={{ height: '80%' }}></div>
                  <div className="flex-1 bg-prism-violet/20 hover:bg-prism-violet/40 transition-colors rounded-t-sm" style={{ height: '75%' }}></div>
                  <div className="flex-1 bg-prism-violet/20 hover:bg-prism-violet/40 transition-colors rounded-t-sm" style={{ height: '95%' }}></div>
                  <div className="flex-1 bg-sonic-lime rounded-t-sm" style={{ height: '100%' }}></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 bg-surface-container-lowest border-t border-glass-border">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-headline-md text-on-surface">Beatzy AI</div>
          <nav className="flex gap-8">
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">Architecture</Link>
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">Privacy</Link>
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">API Documentation</Link>
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">Terms of Resonance</Link>
          </nav>
          <div className="font-code-sm text-code-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</div>
        </div>
      </footer>
    </div>
  );
}
