import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, CloudOff, Disc, Plus } from 'lucide-react';
import { getHistory } from '../api/audio';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import { EmptyState, IconButton, PageHeader, SearchField, Skeleton } from '../components/ui';

const PAGE_SIZE = 12;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function History() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Debounce typing into one request, and start from page 1 for a new query.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError(null);
    getHistory(page, PAGE_SIZE, query ? { search: query } : {})
      .then(({ data }) => {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message || 'Failed to load your history';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const countLabel = pagination.total === 1 ? '1 track' : `${pagination.total} tracks`;

  return (
    <PageWrapper className="space-y-10 pb-16">
      <PageHeader
        eyebrow="History"
        title="Your tracks"
        description={query ? `${countLabel} matching “${query}”` : `${countLabel} analysed so far.`}
        actions={
          <>
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or artist"
              className="w-full sm:w-72"
              aria-label="Search your tracks"
            />
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" /> Analyze
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : error ? (
        <EmptyState
          icon={CloudOff}
          title="Couldn't load your history"
          description={error}
          action={<button onClick={fetchHistory} className="btn-secondary text-sm">Try again</button>}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Disc}
          title={query ? 'No matches' : 'No tracks yet'}
          description={query ? 'Try a different title or artist.' : 'Upload a file, record a snippet, or search the catalog to run your first analysis.'}
          action={
            query ? (
              <button onClick={() => setSearch('')} className="btn-secondary text-sm">Clear search</button>
            ) : (
              <Link to="/upload" className="btn-primary inline-flex items-center gap-2 text-sm">Analyze a track</Link>
            )
          }
        />
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {jobs.map((job) => <GlassRecordSleeve key={job.id} job={job} />)}
          </motion.div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-line-subtle pt-8">
              <IconButton aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <span className="text-[0.8125rem] tabular-nums text-ink-muted">
                Page <span className="font-medium text-ink">{page}</span> of {pagination.pages}
              </span>
              <IconButton aria-label="Next page" disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </IconButton>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
