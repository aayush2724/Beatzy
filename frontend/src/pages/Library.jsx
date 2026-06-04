import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getFavorites, getCollections, createCollection, removeFavorite } from '../api/library';
import { getHistory } from '../api/audio';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import { 
  Search, 
  Star, 
  Layers, 
  Music,
  ArrowRightLeft
} from 'lucide-react';

export default function Library() {
  const [favorites, setFavorites] = useState([]);
  const [collections, setCollections] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCollection, setNewCollection] = useState('');
  const [searchQuery, setSearchSearchQuery] = useState('');

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
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchSearchQuery(e.target.value)}
                    placeholder="Search favorites..."
                    className="input pl-11 py-2.5 text-xs"
                />
            </div>
            <Link to="/compare" className="btn-secondary text-xs px-5 py-2.5 flex items-center gap-2 whitespace-nowrap">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Compare tracks
            </Link>
        </div>
      </header>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />)}</div>
      ) : error ? (
        <div className="glass-panel p-10 text-center border border-red-500/20">
          <p className="text-muted font-mono text-xs mb-4">{error}</p>
          <button onClick={load} className="btn-primary px-6 py-2 text-xs">Retry</button>
        </div>
      ) : (
        <>
          <section>
            <h2 className="font-display text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary fill-primary" /> Favorites
            </h2>
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
                      className="absolute top-3 right-3 text-white/40 hover:text-primary transition-colors"
                      aria-label="Remove favorite"
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary" /> Collections
            </h2>
            <form onSubmit={handleCreateCollection} className="flex gap-3 mb-6 max-w-md">
              <input 
                className="input py-2 text-sm"
                value={newCollection} 
                onChange={(e) => setNewCollection(e.target.value)} 
                placeholder="New collection name" 
              />
              <button type="submit" className="btn-primary px-6 py-2 text-xs">Create</button>
            </form>
            <div className="grid md:grid-cols-3 gap-4">
              {collections.map((c) => (
                <div key={c.id} className="glass-panel p-5 border border-glass-border hover:border-white/20 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="font-display font-bold group-hover:text-primary transition-colors">{c.name}</p>
                        <p className="font-mono text-[10px] text-muted mt-1 uppercase tracking-widest">{c.item_count} tracks registered</p>
                    </div>
                    <Layers className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                <Music className="w-4 h-4 text-tertiary" /> Add from recent
            </h2>
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
