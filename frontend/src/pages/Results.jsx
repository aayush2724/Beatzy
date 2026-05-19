import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getResults } from '../api/audio';
import { SongCard, AudioMetricsGrid, YAMNetCard } from '../components/ResultCards';

export default function Results() {
  const { jobId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getResults(jobId)
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success('Copied to clipboard!');
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="text-brand-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-32">
      <p className="text-red-400 mb-4">{error}</p>
      <Link to="/upload" className="btn-primary">Try again</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-3xl font-bold flex-1">Analysis Results</h1>
        <button onClick={copyJson} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
          <Share2 size={16} /> Export JSON
        </button>
      </div>

      <div className="space-y-6">
        <SongCard result={result} />
        <div>
          <h2 className="text-lg font-semibold mb-4">Audio Features</h2>
          <AudioMetricsGrid result={result} />
        </div>
        <YAMNetCard result={result} />

        {result?.raw_ml_response && (
          <div className="card">
            <h3 className="font-semibold mb-3 text-sm text-gray-400">Raw Analysis Data</h3>
            <pre className="text-xs text-gray-400 font-mono overflow-auto max-h-64 bg-dark-900 p-4 rounded-xl">
              {JSON.stringify(result.raw_ml_response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
