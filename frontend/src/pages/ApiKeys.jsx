import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };
const panelStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' };

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
    api.get('/api/keys')
      .then(({ data }) => setKeys(data.data))
      .catch(err => toast.error(err.message || 'Failed to fetch API keys'))
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
      toast.success('API Key authorized!', { style: { background: '#0f0a20', color: '#ff2e97', border: '1px solid rgba(255,46,151,0.3)' } });
    } catch (err) {
      toast.error(err.message || 'Key authorization failure');
    } finally { setCreating(false); }
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await api.delete(`/api/keys/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Key revoked');
    } catch (err) { toast.error(err.message || 'Revocation failed'); }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard!', { style: { background: '#0f0a20', color: '#ff2e97', border: '1px solid rgba(255,46,151,0.3)' } });
  }

  if (!canUseApiKeys) return (
    <div className="flex items-center justify-center py-20 px-6">
      <div className="max-w-md w-full text-center rounded-2xl p-10" style={panelStyle}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="material-symbols-outlined text-white/20 text-3xl">lock</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3" style={SG}>API Console Restricted</h2>
        <p className="font-mono text-xs text-white/30 mb-8 leading-relaxed">Upgrade to Pro or Enterprise to provision secure API keys and access the programmatic pipeline.</p>
        <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]" style={{ background: '#ff2e97', color: '#0a0613' }}>
          <span className="material-symbols-outlined text-sm">bolt</span>
          Upgrade Protocol
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={SG}>API Key Matrix</h1>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mt-1">Programmatic access to the high-frequency audio analysis pipeline</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] self-start" style={{ background: '#ff2e97', color: '#0a0613', boxShadow: '0 0 20px rgba(255,46,151,0.15)', ...SG }}>
          <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Provision Key'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          {/* New key banner */}
          {newKey && (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'rgba(255,46,151,0.04)', border: '1px solid rgba(255,46,151,0.2)' }}>
              <div className="absolute top-0 left-0 w-0.5 h-full bg-sonic-lime" />
              <div className="flex items-center gap-2 mb-3 text-sonic-lime">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Key Provisioned Successfully</span>
              </div>
              <p className="font-mono text-[10px] text-white/30 mb-4">Copy your credentials below. This value will not be shown again.</p>
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <code className="font-mono text-xs text-white/80 select-all truncate">{newKey}</code>
                <button onClick={() => copyKey(newKey)} className="material-symbols-outlined text-white/30 hover:text-sonic-lime transition-colors text-sm flex-shrink-0">content_copy</button>
              </div>
              <p className="font-mono text-[9px] text-white/20 mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">warning</span>
                Never expose private API keys in frontend repositories.
              </p>
            </div>
          )}

          {/* Create form */}
          {showForm && (
            <div className="rounded-2xl p-6" style={panelStyle}>
              <h3 className="font-bold text-sm text-white mb-4" style={SG}>Provision Key Credentials</h3>
              <form onSubmit={createKey} className="flex flex-col md:flex-row gap-3">
                <input className="flex-grow px-4 py-3 rounded-xl text-xs text-white outline-none transition-all placeholder:text-white/20" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Scope Identifier (e.g. Production Web Core)" value={newName} onChange={e => setNewName(e.target.value)} required onFocus={e => e.target.style.borderColor = 'rgba(255,46,151,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                <button type="submit" disabled={creating} className="px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0 disabled:opacity-50" style={{ background: '#ff2e97', color: '#0a0613' }}>
                  {creating ? 'Authorizing...' : 'Authorize'}
                </button>
              </form>
            </div>
          )}

          {/* Keys list */}
          <div>
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-widest mb-3">Active Keys</p>
            {loading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={panelStyle} />)}</div>
            ) : keys.length > 0 ? keys.map(key => (
              <div key={key.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl mb-3 transition-all hover:border-white/12" style={{ ...panelStyle, borderLeft: '2px solid #ff2e97' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h4 className="font-bold text-sm text-white truncate" style={SG}>{key.name}</h4>
                    <span className="px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,46,151,0.1)', border: '1px solid rgba(255,46,151,0.2)', color: '#ff2e97' }}>Active</span>
                  </div>
                  <code className="font-mono text-xs text-white/30">{key.key_prefix}••••••••</code>
                </div>
                <div className="flex gap-6 text-center shrink-0">
                  <div>
                    <p className="font-mono text-[8px] text-white/25 uppercase tracking-widest mb-0.5">API Calls</p>
                    <p className="font-mono text-sm font-bold text-white">{key.request_count?.toLocaleString() ?? '0'}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] text-white/25 uppercase tracking-widest mb-0.5">Last Used</p>
                    <p className="font-mono text-sm font-bold text-white">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
                <button onClick={() => revokeKey(key.id)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0" style={{ border: '1px solid rgba(255,255,255,0.08)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = ''; }}>
                  <span className="material-symbols-outlined text-base text-white/30">delete</span>
                </button>
              </div>
            )) : (
              <div className="p-10 rounded-2xl text-center" style={panelStyle}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="material-symbols-outlined text-2xl text-white/20">key</span>
                </div>
                <h4 className="font-bold text-base text-white mb-2" style={SG}>No Active API Keys</h4>
                <p className="font-mono text-xs text-white/30">Provision a key to start querying the pipeline programmatically.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="font-mono text-[9px] text-white/30 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sonic-lime animate-pulse" />
                cURL Matrix Query
              </span>
              <button onClick={() => { navigator.clipboard.writeText('curl -X POST https://api.beatzy.io/api/audio/upload -H "X-API-Key: YOUR_KEY" -F "audio=@song.mp3"'); toast.success('Copied!'); }} className="material-symbols-outlined text-white/25 hover:text-sonic-lime text-sm transition-colors">content_copy</button>
            </div>
            <div className="p-5 overflow-x-auto">
              <pre className="font-mono text-[10px] leading-relaxed">
                <span className="text-white/70">curl</span><span className="text-white/40"> -X POST </span><span className="text-sonic-lime/70">https://api.beatzy.io</span><span className="text-white/40">/api/audio/upload \{'\n'}</span>
                <span className="text-white/40">  -H </span><span className="text-sonic-lime/80">"X-API-Key: YOUR_KEY"</span><span className="text-white/40"> \{'\n'}</span>
                <span className="text-white/40">  -F </span><span className="text-sonic-lime/80">"audio=@song.mp3"</span>
              </pre>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={panelStyle}>
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sonic-lime text-sm">menu_book</span>
              Reference Docs
            </p>
            <ul className="space-y-2">
              {['Signal Core Credentials', 'API Bandwidth & Quotas', 'Synthesizer SDK'].map(doc => (
                <li key={doc}>
                  <a href="#" className="flex items-center justify-between p-2.5 rounded-xl transition-all group" style={{ border: '1px solid transparent' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                    <span className="font-mono text-xs text-white/40 group-hover:text-white/70 transition-colors">{doc}</span>
                    <span className="material-symbols-outlined text-sm text-white/20 group-hover:translate-x-1 transition-all">arrow_forward</span>
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
