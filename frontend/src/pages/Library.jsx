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
  ArrowRightLeft,
  FolderPlus,
  History,
  ArrowUpRight
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
      toast.success('Neural collection initialized');
      load();
    } catch {
      toast.error('Initialization failure');
    }
  }

  return (
    <PageWrapper className="space-y-16 pb-20 animate-page-entrance">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-[#1A1410]/5 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4860A]/20 bg-[#D4860A]/5 text-[#D4860A] font-mono text-[9px] uppercase tracking-[0.2em]">
              <Layers className="w-3 h-3" /> Central Registry
          </div>
          <h1 className="text-6xl font-display font-black text-[#1A1410] tracking-tighter uppercase leading-none">Neural <span className="text-[#D4860A] text-glow-sandy">Library</span></h1>
          <p className="font-mono text-[10px] text-[#1A1410]/30 uppercase tracking-[0.3em]">Curated spectral signatures and collections</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80 group">
                <div className="absolute inset-0 bg-[#D4860A]/5 blur-[15px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1410]/20 w-4 h-4 group-focus-within:text-[#D4860A] transition-colors" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchSearchQuery(e.target.value)}
                    placeholder="Filter registry..."
                    className="w-full h-12 bg-white/[0.03] border border-[#1A1410]/10 rounded-xl pl-12 pr-4 text-[#1A1410] text-xs placeholder:text-[#1A1410]/20 focus:outline-none focus:border-[#D4860A]/30 transition-all font-mono uppercase tracking-widest"
                />
            </div>
            <Link to="/compare" className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-[#1A1410]/10 bg-white/[0.03] text-[#1A1410] font-mono text-[10px] uppercase tracking-widest hover:bg-white/[0.06] transition-all">
                <ArrowRightLeft className="w-4 h-4" /> Cross-Reference
            </Link>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-[2.5rem] bg-white/[0.02] border border-[#1A1410]/5 animate-pulse" />
            ))}
        </div>
      ) : error ? (
        <div className="glass-card p-12 text-center border border-red-500/20 max-w-xl mx-auto">
          <p className="text-red-300 font-mono text-xs uppercase tracking-widest mb-8">{error}</p>
          <button onClick={load} className="px-8 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#D4860A] transition-all">Retry Link</button>
        </div>
      ) : (
        <div className="space-y-24">
          <section className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="font-display font-black text-xl text-[#1A1410] uppercase tracking-[0.2em] flex items-center gap-4">
                    <span className="w-8 h-px bg-[#1A1410]/30" /> 
                    <Star className="w-5 h-5 text-[#1A1410] fill-[#1A1410]/20" />
                    Starred Signatures
                </h2>
                <span className="font-mono text-[10px] text-[#1A1410]/20 uppercase tracking-widest">{favorites.length} entries</span>
            </div>
            {favorites.length === 0 ? (
              <div className="obsidian-panel p-12 rounded-[2.5rem] border border-dashed border-[#1A1410]/5 text-center">
                <p className="text-[#1A1410]/20 text-xs font-mono uppercase tracking-[0.2em]">No starred signatures found in registry.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {favorites.map((job) => (
                  <div key={job.id} className="relative group">
                    <GlassRecordSleeve job={job} />
                    <button
                      type="button"
                      onClick={() => removeFavorite(job.id).then(load)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#2D1F18]/60 backdrop-blur-md border border-[#1A1410]/10 flex items-center justify-center text-[#1A1410] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      aria-label="Remove favorite"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <h2 className="font-display font-black text-xl text-[#1A1410] uppercase tracking-[0.2em] flex items-center gap-4">
                    <span className="w-8 h-px bg-[#FFDAB9]/30" /> 
                    <Layers className="w-5 h-5 text-[#FFDAB9]" />
                    Neural Collections
                </h2>
                <form onSubmit={handleCreateCollection} className="flex gap-3 w-full sm:w-auto group">
                  <div className="relative">
                    <FolderPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1410]/20 w-4 h-4" />
                    <input 
                        className="h-12 bg-white/[0.03] border border-[#1A1410]/10 rounded-xl pl-12 pr-4 text-[#1A1410] text-xs placeholder:text-[#1A1410]/20 focus:outline-none focus:border-[#FFDAB9]/30 transition-all font-mono uppercase tracking-widest"
                        value={newCollection} 
                        onChange={(e) => setNewCollection(e.target.value)} 
                        placeholder="Label Identifier" 
                    />
                  </div>
                  <button type="submit" className="px-6 h-12 rounded-xl bg-[#FFDAB9] text-[#1A1410] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(232,160,132,0.2)]">
                    Initialize
                  </button>
                </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((c) => (
                <div key={c.id} className="obsidian-panel p-6 rounded-[2rem] border border-[#1A1410]/5 hover:border-[#FFDAB9]/30 transition-all cursor-pointer group flex flex-col justify-between h-48 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Layers className="w-24 h-24 text-[#FFDAB9]" />
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-[#FFDAB9]/10 border border-[#FFDAB9]/20 flex items-center justify-center text-[#FFDAB9]">
                        <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="relative z-10">
                      <p className="font-display font-black text-lg text-[#1A1410] uppercase tracking-tight group-hover:text-[#FFDAB9] transition-colors">{c.name}</p>
                      <p className="font-mono text-[9px] text-[#1A1410]/30 mt-2 uppercase tracking-[0.2em]">{c.item_count} Signatures Indexed</p>
                  </div>
                </div>
              ))}
              {collections.length === 0 && (
                <div className="lg:col-span-4 obsidian-panel p-12 rounded-[2.5rem] border border-dashed border-[#1A1410]/5 text-center">
                    <p className="text-[#1A1410]/20 text-xs font-mono uppercase tracking-[0.2em]">No collections initialized.</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="font-display font-black text-xl text-[#1A1410] uppercase tracking-[0.2em] flex items-center gap-4">
                    <span className="w-8 h-px bg-[#D4860A]/30" /> 
                    <History className="w-5 h-5 text-[#D4860A]" />
                    Recently Indexed
                </h2>
                <Link to="/history" className="group flex items-center gap-2 text-[10px] font-mono text-[#D4860A] uppercase tracking-widest hover:text-[#1A1410] transition-colors">
                    Access full archives <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recent.slice(0, 4).map((job) => (
                <GlassRecordSleeve key={job.id} job={job} />
              ))}
            </div>
          </section>
        </div>
      )}
    </PageWrapper>
  );
}

import { X } from 'lucide-react';
