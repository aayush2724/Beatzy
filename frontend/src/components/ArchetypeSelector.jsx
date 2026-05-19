import React, { useState } from 'react';

const DEFAULT_ARCHETYPES = [
  {
    id: 'daft',
    name: 'Daft Punk',
    desc: 'Electronic Precision',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmvPWy4WAYyDVWQwzjpG-zTw1OfIHBJ3SkKtz6-LaFE671VhCZuSi0IhyqKRHWVNd_F9cGe6ysHXPm0xCDcl3hmY38_8AK_PHNCt_RY5sc4d4LAOHmIvOVkBc6YhB8i7ZdZez_D4Lk74tCYWYxdFVgIV6edkPLT0V-7IqybQllLInxAcPBx2qPvzAnKTyxeN5UiVDUj-wo41lZ36qNwely4BZOBqYoNL-5G-HS7DBi7K8mmVTAz1Kme-_GKCREzldu9feFJsD4cA',
  },
  { id: 'pink', name: 'Pink Floyd', desc: 'Psychedelic Depth', img: '' },
  { id: 'queen', name: 'Queen', desc: 'Orchestral Power', img: '' },
];

export default function ArchetypeSelector({ onSelect }) {
  const [selected, setSelected] = useState(DEFAULT_ARCHETYPES[0].id);

  function handleSelect(id) {
    setSelected(id);
    if (onSelect) onSelect(id);
  }

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="font-label-sm text-outline mb-6 uppercase tracking-widest">Select Sound Archetype</h3>
      <div className="flex flex-wrap justify-center gap-6">
        {DEFAULT_ARCHETYPES.map((a) => (
          <div
            key={a.id}
            onClick={() => handleSelect(a.id)}
            className={`archetype-card cursor-pointer group flex flex-col items-center p-6 border rounded-lg w-[160px] ${selected === a.id ? 'active border-white/20' : 'border-white/5'}`}
          >
            <div className="w-20 h-20 mb-4 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center bg-surface-container-high">
              {a.img ? <img src={a.img} alt={a.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-3xl">music_note</span>}
            </div>
            <span className="font-label-md text-primary mb-1">{a.name}</span>
            <span className="font-label-sm text-outline text-[10px]">{a.desc}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => alert(`Resonate -> ${selected}`)}
        className="mt-8 bg-secondary text-surface font-label-md px-8 py-3 rounded-full hover:bg-primary transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined">bolt</span>
        Resonate
      </button>
    </div>
  );
}
