import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRightLeft, ArrowUpRight, FolderPlus, Folder, Heart, History, X } from 'lucide-react';
import { getFavorites, getCollections, createCollection, removeFavorite } from '../api/library';
import { getHistory } from '../api/audio';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  SearchField,
  SectionHeader,
  Skeleton,
} from '../components/ui';

export default function Library() {
  const [favorites, setFavorites] = useState([]);
  const [collections, setCollections] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCollection, setNewCollection] = useState('');
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getFavorites(), getCollections(), getHistory(1, 8)])
      .then(([fav, col, hist]) => {
        setFavorites(fav.data.data);
        setCollections(col.data.data);
        setRecent(hist.data.data.jobs.filter((j) => j.status === 'completed'));
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load your library'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleFavorites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((j) =>
      [j.song_title, j.song_artist, j.original_filename].some((v) => v && v.toLowerCase().includes(q)),
    );
  }, [favorites, query]);

  async function handleCreateCollection(e) {
    e.preventDefault();
    const name = newCollection.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createCollection(name);
      setNewCollection('');
      toast.success(`Created “${name}”`);
      load();
    } catch {
      toast.error("Couldn't create the collection");
    } finally {
      setCreating(false);
    }
  }

  async function handleRemoveFavorite(job) {
    try {
      await removeFavorite(job.id);
      setFavorites((list) => list.filter((j) => j.id !== job.id));
      toast.success('Removed from saved tracks');
    } catch {
      toast.error("Couldn't remove this track");
    }
  }

  return (
    <PageWrapper className="space-y-10 pb-16">
      <PageHeader
        eyebrow="Library"
        title="Saved tracks"
        description="Tracks you've saved, your collections, and what you analysed most recently."
        actions={
          <>
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter saved tracks"
              className="w-full sm:w-64"
              aria-label="Filter saved tracks"
            />
            <Link to="/compare" className="btn-secondary inline-flex items-center gap-2 text-sm">
              <ArrowRightLeft className="h-4 w-4" /> Compare
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : error ? (
        <EmptyState
          icon={Heart}
          title="Couldn't load your library"
          description={error}
          action={<button onClick={load} className="btn-secondary text-sm">Try again</button>}
        />
      ) : (
        <div className="space-y-12">
          {/* Saved */}
          <section className="space-y-5">
            <SectionHeader
              title="Saved"
              description={favorites.length === 1 ? '1 track' : `${favorites.length} tracks`}
            />
            {favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Nothing saved yet"
                description="Use the heart on any result to keep it here."
                action={<Link to="/history" className="btn-secondary inline-flex items-center text-sm">Browse your history</Link>}
              />
            ) : visibleFavorites.length === 0 ? (
              <EmptyState icon={Heart} title="No matches" description="Try a different title or artist." action={<button onClick={() => setQuery('')} className="btn-secondary text-sm">Clear filter</button>} />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleFavorites.map((job) => (
                  <div key={job.id} className="group relative">
                    <GlassRecordSleeve job={job} />
                    <IconButton
                      size="sm"
                      aria-label="Remove from saved tracks"
                      onClick={() => handleRemoveFavorite(job)}
                      className="absolute right-6 top-6 z-20 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Collections */}
          <section className="space-y-5">
            <SectionHeader
              title="Collections"
              description="Group tracks for a set, a project or a mood."
              action={
                <form onSubmit={handleCreateCollection} className="flex items-end gap-2">
                  <Input
                    aria-label="New collection name"
                    placeholder="New collection"
                    value={newCollection}
                    onChange={(e) => setNewCollection(e.target.value)}
                    icon={FolderPlus}
                    className="w-48 md:w-56"
                  />
                  <Button type="submit" size="sm" disabled={creating || !newCollection.trim()} className="!h-11 !py-0">
                    {creating ? 'Creating…' : 'Create'}
                  </Button>
                </form>
              }
            />
            {collections.length === 0 ? (
              <EmptyState icon={Folder} title="No collections yet" description="Create one above to start grouping tracks." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {collections.map((c) => (
                  <Card key={c.id} hover className="flex h-40 flex-col justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-subtle bg-veil-1">
                      <Folder className="h-4 w-4 text-accent-warm" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-semibold text-ink">{c.name}</p>
                      <p className="text-xs text-ink-muted">{Number(c.item_count) === 1 ? '1 track' : `${c.item_count ?? 0} tracks`}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Recent */}
          <section className="space-y-5">
            <SectionHeader
              title="Recently analysed"
              action={
                <Link to="/history" className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand hover:text-brand-hover">
                  All history <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {recent.length === 0 ? (
              <EmptyState icon={History} title="No completed analyses yet" action={<Link to="/upload" className="btn-primary inline-flex items-center text-sm">Analyze a track</Link>} />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {recent.slice(0, 4).map((job) => <GlassRecordSleeve key={job.id} job={job} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </PageWrapper>
  );
}
