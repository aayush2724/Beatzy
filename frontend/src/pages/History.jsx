import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getHistory } from '../api/audio';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import toast from 'react-hot-toast';

import { 
  Plus, 
  CloudOff, 
  Disc, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Activity,
  Database,
  ArrowUpRight
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function History() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError(null);
    getHistory(page, 12)
      .then(({ data }) => {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message || 'Failed to load analysis history';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <PageWrapper className="space-y-12 pb-20 animate-page-entrance">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-line-subtle pb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand font-mono text-[11px] uppercase tracking-[0.15em]">
                  <Database className="w-3 h-3" /> Historical Matrix
              </div>
              <h1 className="text-6xl font-display font-black text-ink tracking-tighter uppercase leading-none">Signal <span className="text-brand text-glow-orange">Archives</span></h1>
              <p className="font-mono text-[11px] text-ink/30 uppercase tracking-[0.2em]">{pagination.total} Waveforms indexed in neural core</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <div className="relative w-full sm:w-80 group">
                    <div className="absolute inset-0 bg-brand/5 blur-[15px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20 w-4 h-4 group-focus-within:text-brand transition-colors" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search archived signals..."
                        className="w-full h-12 bg-ink/[0.03] border border-line rounded-xl pl-12 pr-4 text-ink text-xs placeholder:text-ink/20 focus:outline-none focus:border-brand/30 transition-all font-mono uppercase tracking-widest"
                    />
                </div>
                <Link to="/upload" className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-brand text-brand-ink font-black text-[10px] uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(255,107,53,0.15)] hover:scale-105 transition-all">
                    <Plus className="w-4 h-4" /> New Extraction
                </Link>
            </div>
        </header>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-72 rounded-[2.5rem] bg-ink/[0.02] border border-line-subtle animate-pulse" />
                ))}
            </div>
        ) : error ? (
            <div className="h-80 glass-card border-red-500/20 flex flex-col items-center justify-center text-center p-12 gap-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <CloudOff className="w-8 h-8 text-red-400 opacity-60" />
                </div>
                <div className="space-y-2">
                    <p className="text-ink text-lg font-display font-black uppercase tracking-tight">Archives Offline</p>
                    <p className="text-red-300/40 font-mono text-[11px] uppercase tracking-widest">{error}</p>
                </div>
                <button onClick={fetchHistory} className="px-8 py-3 rounded-xl bg-ink text-brand-ink font-black text-[10px] uppercase tracking-widest hover:bg-brand hover:text-brand-ink transition-all">Retry Link</button>
            </div>
        ) : jobs.length === 0 ? (
            <div className="h-80 obsidian-panel rounded-[3rem] border border-dashed border-line-subtle flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-ink/5 rounded-[2rem] flex items-center justify-center mb-8 border border-line-subtle">
                    <Disc className="w-10 h-10 text-ink/10" />
                </div>
                <h3 className="text-2xl font-display font-black text-ink uppercase tracking-tight mb-3">Archive Registry Empty</h3>
                <p className="text-on-surface-variant font-mono text-[11px] uppercase tracking-[0.15em] mb-8 max-w-xs mx-auto">No spectral signatures detected in your account history.</p>
                <Link to="/upload" className="flex items-center gap-3 px-8 py-4 rounded-xl bg-ink text-brand-ink font-black text-[10px] uppercase tracking-widest hover:bg-brand hover:text-brand-ink transition-all">
                    Initialize Extraction <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>
        ) : (
            <>
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    {jobs.map(job => (
                        <GlassRecordSleeve key={job.id} job={job} />
                    ))}
                </motion.div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-16 border-t border-line-subtle">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="flex items-center gap-3 px-8 py-4 rounded-xl border border-line-subtle bg-ink/[0.02] text-ink/40 hover:text-ink hover:border-line transition-all disabled:opacity-10 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous Sector
                        </button>
                        <div className="px-6 py-2 rounded-lg bg-ink/5 border border-line-subtle">
                            <span className="font-mono text-[10px] text-ink font-black uppercase tracking-[0.2em]"><span className="text-brand">{page}</span> <span className="opacity-20 mx-2">/</span> {pagination.pages}</span>
                        </div>
                        <button 
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-3 px-8 py-4 rounded-xl border border-line-subtle bg-ink/[0.02] text-ink/40 hover:text-ink hover:border-line transition-all disabled:opacity-10 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            Next Sector <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </>
        )}

        {/* Technical Footer Decoration */}
        <div className="flex justify-between items-center pt-20 font-mono text-[10px] text-ink/10 uppercase tracking-[0.3em] select-none">
            <div className="flex items-center gap-4">
                <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                Neural Archive Link Active
            </div>
            <div>Database Status: Synchronized</div>
            <div className="flex items-center gap-2">
                <Activity className="w-2 h-2" />
                Pipeline V4.2
            </div>
        </div>
    </PageWrapper>
  );
}
