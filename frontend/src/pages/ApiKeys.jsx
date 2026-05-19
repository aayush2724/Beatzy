import { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Copy, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

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

  if (!canUseApiKeys) return (
    <div className="max-w-lg mx-auto text-center py-20">
      <Lock size={48} className="text-gray-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">API Access requires Pro</h2>
      <p className="text-gray-400 mb-6">Upgrade to Pro or Enterprise to get API keys and integrate Beatzy into your apps.</p>
      <Link to="/pricing" className="btn-primary">View plans</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">API Keys</h1>
          <p className="text-gray-400">Use these keys to access the Beatzy API.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New key
        </button>
      </div>

      {newKey && (
        <div className="card border-green-600/30 bg-green-600/5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold mb-1">Save your API key now</p>
              <p className="text-gray-400 text-sm mb-3">This key will not be shown again.</p>
              <div className="flex items-center gap-3 bg-dark-900 rounded-xl px-4 py-3 font-mono text-sm">
                <span className="flex-1 truncate text-green-400">{newKey}</span>
                <button onClick={() => copyKey(newKey)} className="text-gray-400 hover:text-white shrink-0">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create new API key</h3>
          <form onSubmit={createKey} className="flex gap-3">
            <input
              className="input"
              placeholder="Key name (e.g. Production, My App)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary shrink-0" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary shrink-0">
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-dark-700 rounded-xl animate-pulse" />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12">
            <Key size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-600">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center shrink-0">
                  <Key size={18} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{key.key_prefix}••••••••</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{key.request_count} requests</p>
                  {key.last_used_at && (
                    <p className="text-xs text-gray-600">Last used {new Date(key.last_used_at).toLocaleDateString()}</p>
                  )}
                </div>
                <button onClick={() => revokeKey(key.id)} className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold mb-3">Quick start</h3>
        <pre className="text-xs font-mono text-gray-400 bg-dark-900 p-4 rounded-xl overflow-auto">{`curl -X POST https://api.beatzy.io/api/audio/upload \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "audio=@song.mp3"`}</pre>
      </div>
    </div>
  );
}
