import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getFavorites, getCollections, createCollection, removeFavorite } from '../api/library';
import { getHistory } from '../api/audio';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import { Button, Input, SkeletonCard } from '../components/ui';

export default function Library() {
  const [favorites, setFavorites] = useState([]);
  const [collections, setCollections] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCollection, setNewCollection] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getFavorites(), getCollections(), getHistory(1, 8)])
      .then(([fav, col, hist]) => {
        setFavorites(fav.data.data);
        setCollections(col.data.data);
        setRecent(hist.data.data.jobs.filter((j) => j.status === 'completed'));
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateCollection(e) {
    e.preventDefault();
    if (!newCollection.trim()) return;
    try {
      await createCollection(newCollection.trim());
      setNewCollection('');
      toast.success('Collection created');
      load();
    } catch {
      toast.error('Could not create collection');
    }
  }

  return (
    <PageWrapper className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-glass-border pb-8">
        <div>
          <h1 className="font-display text-fluid-h1 uppercase tracking-tight">Library</h1>
          <p className="font-mono text-xs text-muted uppercase tracking-widest mt-2">Favorites &amp; collections</p>
        </div>
        <Link to="/compare" className="btn-secondary text-xs px-5 py-2.5">Compare tracks</Link>
      </header>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : error ? (
        <div className="glass-panel p-10 text-center border border-red-500/20">
          <p className="text-muted font-mono text-xs mb-4">{error}</p>
          <Button onClick={load}>Retry</Button>
        </div>
      ) : (
        <>
          <section>
            <h2 className="font-display text-sm uppercase tracking-widest mb-6">Favorites</h2>
            {favorites.length === 0 ? (
              <p className="text-muted text-sm font-mono">Star analyses from results to save them here.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {favorites.map((job) => (
                  <div key={job.id} className="relative">
                    <GlassRecordSleeve job={job} />
                    <button
                      type="button"
                      onClick={() => removeFavorite(job.id).then(load)}
                      className="absolute top-3 right-3 text-muted hover:text-accent"
                      aria-label="Remove favorite"
                    >
                      <span className="material-symbols-outlined text-sm">star</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-sm uppercase tracking-widest mb-6">Collections</h2>
            <form onSubmit={handleCreateCollection} className="flex gap-3 mb-6 max-w-md">
              <Input value={newCollection} onChange={(e) => setNewCollection(e.target.value)} placeholder="New collection name" />
              <Button type="submit" size="sm">Create</Button>
            </form>
            <div className="grid md:grid-cols-3 gap-4">
              {collections.map((c) => (
                <div key={c.id} className="glass-panel p-5 border border-glass-border">
                  <p className="font-display font-bold">{c.name}</p>
                  <p className="font-mono text-[10px] text-muted mt-1">{c.item_count} tracks</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-sm uppercase tracking-widest mb-6">Add from recent</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {recent.map((job) => (
                <GlassRecordSleeve key={job.id} job={job} />
              ))}
            </div>
          </section>
        </>
      )}
    </PageWrapper>
  );
}
