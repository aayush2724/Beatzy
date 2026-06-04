import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ENDPOINTS = [
  { method: 'POST', path: '/api/audio/upload', desc: 'Upload audio file (multipart field: audio)' },
  { method: 'POST', path: '/api/audio/upload-batch', desc: 'Batch upload (multipart field: audio, multiple files)' },
  { method: 'GET', path: '/api/results/:jobId', desc: 'Get analysis results for a job' },
  { method: 'GET', path: '/api/results/:jobId/export', desc: 'Download JSON audio report' },
  { method: 'GET', path: '/api/public/r/:shareToken', desc: 'Public shared result (no auth)' },
  { method: 'GET', path: '/api/audio/history', desc: 'Paginated analysis history' },
];

export default function ApiDocs() {
  usePageMeta({
    title: 'API Documentation',
    description: 'Beatzy public API for music analysis — upload, results, and sharing.',
  });

  return (
    <div className="min-h-screen bg-bg text-accent font-body">
      <nav className="border-b border-glass-border px-6 py-6 flex justify-between">
        <Link to="/" className="font-display tracking-[0.2em] text-sm">BEATZY</Link>
        <a href={`${apiBase}/api/docs`} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-5 py-2">
          Open Swagger
        </a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="font-display text-fluid-h1 uppercase tracking-tight mb-4">API</h1>
          <p className="text-muted text-sm leading-relaxed">
            Authenticate with <code className="text-accent bg-white/5 px-1 rounded">Authorization: Bearer &lt;token&gt;</code> or{' '}
            <code className="text-accent bg-white/5 px-1 rounded">X-API-Key</code>. Base URL:{' '}
            <code className="text-accent">{apiBase}</code>
          </p>
        </div>

        <ul className="space-y-3">
          {ENDPOINTS.map((ep) => (
            <li key={ep.path + ep.method} className="glass-panel p-4 flex gap-4 items-start border border-glass-border">
              <span className="font-mono text-[10px] font-bold text-accent bg-white/10 px-2 py-1 rounded shrink-0">{ep.method}</span>
              <div>
                <code className="text-sm block mb-1">{ep.path}</code>
                <p className="text-muted text-xs">{ep.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-muted text-xs font-mono">
          Pro &amp; Enterprise plans include higher rate limits. See <Link to="/pricing" className="text-accent underline">pricing</Link>.
        </p>
      </main>
    </div>
  );
}
