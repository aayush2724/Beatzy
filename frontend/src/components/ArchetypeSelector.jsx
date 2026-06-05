import React, { useState } from 'react';

const DEFAULT_ARCHETYPES = [
  {
    id: 'daft',
    name: 'Daft Punk',
    desc: 'Electronic Precision',
    img: '',
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
            className={`archetype-card cursor-pointer group flex flex-col items-center p-6 glass-card rounded-lg w-[160px] transition-all ${selected === a.id ? 'active border-vibrant-orange/40' : 'border-glass-border hover:border-vibrant-orange/20'}`}
          >
            <div className="w-20 h-20 mb-4 rounded-full overflow-hidden border-2 border-vibrant-orange/20 flex items-center justify-center bg-surface-container-high">
              {a.img ? <img src={a.img} alt={a.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-3xl text-vibrant-orange">music_note</span>}
            </div>
            <span className="font-label-md text-on-surface mb-1">{a.name}</span>
            <span className="font-label-sm text-outline text-[10px]">{a.desc}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => alert(`Resonate -> ${selected}`)}
        className="mt-8 btn-primary flex items-center gap-2"
      >
        <span className="material-symbols-outlined">bolt</span>
        Resonate
      </button>
    </div>
  );
}
