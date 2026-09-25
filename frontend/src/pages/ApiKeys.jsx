import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpRight, Copy, KeyRound, Lock, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import api from '../api/client';
import PageWrapper from '../components/PageWrapper';
import { useAuthStore } from '../store/authStore';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  SectionHeader,
  Skeleton,
} from '../components/ui';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const CURL_EXAMPLE = `curl -X POST ${API_BASE}/api/audio/upload \\
  -H "X-API-Key: YOUR_KEY" \\
  -F "audio=@track.mp3"`;

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
    if (!canUseApiKeys) {
      setLoading(false);
      return;
    }
    api.get('/api/keys')
      .then(({ data }) => setKeys(data.data))
      .catch(() => toast.error("Couldn't load your API keys"))
      .finally(() => setLoading(false));
  }, [canUseApiKeys]);

  async function createKey(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { data } = await api.post('/api/keys', { name });
      setNewKey(data.data.key);
      setKeys((prev) => [data.data, ...prev]);
      setNewName('');
      setShowForm(false);
      toast.success('API key created');
    } catch {
      toast.error("Couldn't create the key");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(key) {
    if (!window.confirm(`Revoke “${key.name}”? Requests using it will stop working immediately.`)) return;
    try {
      await api.delete(`/api/keys/${key.id}`);
      setKeys((prev) => prev.filter((k) => k.id !== key.id));
      toast.success('Key revoked');
    } catch {
      toast.error("Couldn't revoke the key");
    }
  }

  function copy(text, message = 'Copied') {
    navigator.clipboard.writeText(text);
    toast.success(message);
  }

  if (!canUseApiKeys) {
    return (
      <PageWrapper className="py-16">
        <EmptyState
          icon={Lock}
          title="API keys are available on Pro and Enterprise"
          description="Upgrade to create keys and run analyses from your own code."
          className="mx-auto max-w-lg"
          action={<Link to="/pricing" className="btn-primary inline-flex items-center gap-2 text-sm">See plans <ArrowUpRight className="h-4 w-4" /></Link>}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-8 pb-16">
      <PageHeader
        eyebrow="Developers"
        title="API keys"
        description="Keys let your own code call the same analysis pipeline. Each key can be revoked on its own."
        actions={
          <Button onClick={() => setShowForm((f) => !f)} variant={showForm ? 'secondary' : 'primary'} size="sm" className="inline-flex items-center gap-2">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Create key'}
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-8">
          {newKey && (
            <Card className="border-brand/40">
              <div className="flex items-center gap-2 text-brand">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-medium">New key created — copy it now</p>
              </div>
              <p className="mt-1 text-xs text-ink-muted">For security it won't be shown again. Store it somewhere safe.</p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                <code className="min-w-0 flex-1 select-all truncate font-mono text-sm text-ink">{newKey}</code>
                <IconButton size="sm" aria-label="Copy key" onClick={() => copy(newKey, 'Key copied')}><Copy className="h-4 w-4" /></IconButton>
                <IconButton size="sm" aria-label="Dismiss" onClick={() => setNewKey(null)}><X className="h-4 w-4" /></IconButton>
              </div>
            </Card>
          )}

          {showForm && (
            <Card>
              <SectionHeader title="New key" description="Name it after where it will be used, so revoking later is easy." />
              <form onSubmit={createKey} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input
                  label="Name"
                  placeholder="e.g. Production server"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                />
                <Button type="submit" disabled={creating || !newName.trim()} className="!h-11 !py-0">
                  {creating ? 'Creating…' : 'Create'}
                </Button>
              </form>
            </Card>
          )}

          <section className="space-y-3">
            <SectionHeader title="Your keys" description={keys.length === 1 ? '1 key' : `${keys.length} keys`} />
            {loading ? (
              <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : keys.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title="No keys yet"
                description="Create one to start calling the API."
                action={<Button size="sm" onClick={() => setShowForm(true)}>Create key</Button>}
              />
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <Card key={key.id} padding="sm" className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-ink">{key.name}</p>
                        <Badge variant={key.is_active ? 'ok' : 'danger'} dot>{key.is_active ? 'Active' : 'Revoked'}</Badge>
                      </div>
                      <code className="mt-1 block font-mono text-xs text-ink-muted">{key.key_prefix}••••••••••••••••</code>
                    </div>
                    <dl className="flex gap-8 text-sm md:border-l md:border-line-subtle md:pl-6">
                      <div>
                        <dt className="text-xs text-ink-faint">Requests</dt>
                        <dd className="tabular-nums text-ink">{key.request_count?.toLocaleString() ?? '0'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-faint">Last used</dt>
                        <dd className="text-ink">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</dd>
                      </div>
                    </dl>
                    {key.is_active && (
                      <IconButton aria-label={`Revoke ${key.name}`} onClick={() => revokeKey(key)} className="hover:border-danger/50 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="col-span-12 space-y-6 xl:col-span-4">
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3">
              <p className="text-sm font-medium text-ink">Quick start</p>
              <IconButton size="sm" aria-label="Copy example" onClick={() => copy(CURL_EXAMPLE, 'Example copied')}><Copy className="h-4 w-4" /></IconButton>
            </div>
            <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-ink-muted"><code>{CURL_EXAMPLE}</code></pre>
            <p className="border-t border-line-subtle px-5 py-3 text-xs text-ink-faint">
              Send the key in the <code className="font-mono text-ink-muted">X-API-Key</code> header. The response is a job id; poll <code className="font-mono text-ink-muted">/api/results/:id</code> for the analysis.
            </p>
          </Card>

          <Card>
            <SectionHeader title="Reference" />
            <ul className="mt-3 divide-y divide-line-subtle">
              {[
                ['Interactive API docs', `${API_BASE}/api/docs`],
                ['Authentication', `${API_BASE}/api/docs#/Authentication`],
                ['Rate limits by plan', '/pricing'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-between py-3 text-sm text-ink-muted transition-colors hover:text-ink">
                    {label} <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </PageWrapper>
  );
}
