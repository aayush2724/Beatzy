import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import PublicShell from '../components/PublicShell';
import { Badge, Card } from '../components/ui';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ENDPOINTS = [
  { method: 'POST', path: '/api/audio/upload', desc: 'Upload one audio file (multipart field: audio). Returns a job id.' },
  { method: 'POST', path: '/api/audio/upload-batch', desc: 'Upload several files at once (multipart field: audio, repeated).' },
  { method: 'POST', path: '/api/audio/analyze-url', desc: 'Analyse a catalog preview by URL (from /api/audio/search).' },
  { method: 'GET', path: '/api/audio/search', desc: 'Search the catalog for a song, artist or album.' },
  { method: 'GET', path: '/api/results/:jobId', desc: 'Poll for the analysis; `status` is processing, complete or failed.' },
  { method: 'GET', path: '/api/results/:jobId/export', desc: 'Download the analysis as JSON.' },
  { method: 'GET', path: '/api/audio/history', desc: 'Your analyses, paginated; supports search and BPM/key filters.' },
  { method: 'GET', path: '/api/public/r/:shareToken', desc: 'A shared result. No authentication.' },
];

const METHOD_TONE = { GET: 'brand', POST: 'warm' };

export default function ApiDocs() {
  usePageMeta({ title: 'API', description: 'Beatzy REST API: upload audio, poll results, share analyses.' });

  return (
    <PublicShell width="max-w-3xl">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Developers</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">REST API</h1>
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-muted">
            The same pipeline the app uses, over HTTP. Authenticate with a bearer token or an API key.
          </p>
        </div>
        <a href={`${apiBase}/api/docs`} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 text-sm">
          Interactive docs <ArrowUpRight className="h-4 w-4" />
        </a>
      </header>

      <Card className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Authentication</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Send <code className="rounded bg-veil-2 px-1.5 py-0.5 font-mono text-xs text-ink">Authorization: Bearer &lt;token&gt;</code> from a signed-in session, or{' '}
          <code className="rounded bg-veil-2 px-1.5 py-0.5 font-mono text-xs text-ink">X-API-Key: &lt;key&gt;</code> from the{' '}
          <Link to="/api-keys" className="text-brand hover:text-brand-hover">API keys</Link> page (Pro and Enterprise).
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Base URL: <code className="font-mono text-xs text-ink">{apiBase}</code>
        </p>
      </Card>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Endpoints</h2>
        <Card padding="none">
          <ul className="divide-y divide-line-subtle">
            {ENDPOINTS.map((ep) => (
              <li key={ep.method + ep.path} className="flex items-start gap-4 px-5 py-4">
                <Badge variant={METHOD_TONE[ep.method] || 'neutral'} className="mt-0.5 w-14 justify-center font-mono">{ep.method}</Badge>
                <div className="min-w-0">
                  <code className="block font-mono text-sm text-ink">{ep.path}</code>
                  <p className="mt-1 text-sm text-ink-muted">{ep.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="mt-8 text-sm text-ink-muted">
        Rate limits depend on your plan — see <Link to="/pricing" className="text-brand hover:text-brand-hover">pricing</Link>. Live health is on the <Link to="/status" className="text-brand hover:text-brand-hover">status page</Link>.
      </p>
    </PublicShell>
  );
}
