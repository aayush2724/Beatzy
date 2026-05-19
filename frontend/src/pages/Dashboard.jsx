import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Music2, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { getHistory } from '../api/audio';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

const STATUS_ICONS = {
  completed: <CheckCircle size={16} className="text-green-400" />,
  processing: <Clock size={16} className="text-yellow-400 animate-spin" />,
  queued: <Clock size={16} className="text-gray-400" />,
  failed: <XCircle size={16} className="text-red-400" />,
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory(1, 10).then(({ data }) => {
      setHistory(data.data.jobs);
      setTotal(data.data.pagination.total);
    }).finally(() => setLoading(false));
  }, []);

  const completed = history.filter(j => j.status === 'completed').length;
  const identified = history.filter(j => j.song_title).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.name?.split(' ')[0]}!</p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center gap-2">
          <Upload size={18} /> Analyze audio
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total analyses', value: total, icon: Music2, color: 'text-brand-400' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Songs identified', value: identified, icon: TrendingUp, color: 'text-yellow-400' },
          { label: 'Plan', value: <span className="capitalize">{user?.plan}</span>, icon: Clock, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <Icon size={20} className={clsx(color, 'mb-3')} />
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Analyses</h2>
          <Link to="/upload" className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
            New analysis →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-dark-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <Music2 size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No analyses yet</p>
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
              <Upload size={16} /> Upload your first audio
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((job) => (
              <Link
                key={job.id}
                to={job.status === 'completed' ? `/results/${job.id}` : '#'}
                className={clsx(
                  'flex items-center gap-4 p-4 rounded-xl transition-colors',
                  job.status === 'completed' ? 'hover:bg-dark-700 cursor-pointer' : 'cursor-default'
                )}
              >
                <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center shrink-0">
                  <Music2 size={18} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {job.song_title || job.original_filename}
                  </p>
                  {job.song_artist && (
                    <p className="text-sm text-gray-500 truncate">{job.song_artist}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {STATUS_ICONS[job.status]}
                  <span className="text-xs text-gray-500 capitalize">{job.status}</span>
                </div>
                {job.bpm && (
                  <span className="text-xs text-gray-600 font-mono shrink-0">{job.bpm} BPM</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
