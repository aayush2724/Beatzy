import { Link } from 'react-router-dom';
import WaveformVisualizer from '../components/WaveformVisualizer';
import StyleDNAChart from '../components/StyleDNAChart';
import PublicShell from '../components/PublicShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { Badge, Card, SectionHeader } from '../components/ui';

/**
 * A visual demo of what an analysis looks like, on sample data. It is
 * labelled as such — the real numbers live in the app after sign-in.
 */
export default function ArtistEchoes() {
  usePageMeta({ title: 'Demo', description: 'A demo of Beatzy analysis visuals on sample data.' });

  return (
    <PublicShell width="max-w-6xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-brand">Demo</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">What an analysis looks like</h1>
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-muted">
            Two of the visuals from a Beatzy result, running on sample data. Sign in and analyse a track to see them on your own music.
          </p>
        </div>
        <Badge variant="neutral" dot>Sample data</Badge>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8">
          <SectionHeader title="Waveform" description="How the player renders a track." />
          <div className="mt-6 flex h-72 items-end justify-center px-4">
            <WaveformVisualizer barCount={40} />
          </div>
        </Card>
        <div className="md:col-span-4">
          <StyleDNAChart />
        </div>
      </div>

      <Card className="mt-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-medium text-ink">Try it on a real track</p>
          <p className="text-sm text-ink-muted">Upload a file, record a snippet, or search the catalog — free to start.</p>
        </div>
        <Link to="/register" className="btn-primary inline-flex items-center text-sm">Get started</Link>
      </Card>
    </PublicShell>
  );
}
