/*
 * Ambient3D — lightweight, pure-CSS 3D ambiance rendered once, app-wide.
 * Fixed behind all content (z-index: -1), pointer-events: none, so it never
 * interferes with navigation. Respects prefers-reduced-motion (handled in CSS).
 */
export default function Ambient3D() {
  return (
    <div className="ambient-layer scene-3d" aria-hidden="true">
      {/* Glowing orbs (read as 3D spheres) */}
      <div className="ambient-obj orb orb-magenta float-a w-72 h-72 top-[-4%] left-[-3%] opacity-20" />
      <div className="ambient-obj orb orb-violet float-b w-96 h-96 top-[35%] right-[-6%] opacity-20" />
      <div className="ambient-obj orb orb-cyan float-c w-60 h-60 bottom-[-5%] left-[18%] opacity-15" />
      <div className="ambient-obj orb orb-amber drift-a w-40 h-40 top-[12%] left-[42%] opacity-10" />

      {/* Spinning vinyl record */}
      <div className="ambient-obj float-d w-40 h-40 top-[18%] right-[14%] opacity-30">
        <div className="vinyl3d w-full h-full" />
      </div>

      {/* Rotating 3D cube */}
      <div className="ambient-obj drift-b w-20 h-20 bottom-[16%] right-[22%] opacity-30">
        <div className="cube3d w-20 h-20">
          <span className="face [transform:rotateY(0deg)_translateZ(40px)]" />
          <span className="face [transform:rotateY(90deg)_translateZ(40px)]" />
          <span className="face [transform:rotateY(180deg)_translateZ(40px)]" />
          <span className="face [transform:rotateY(-90deg)_translateZ(40px)]" />
          <span className="face [transform:rotateX(90deg)_translateZ(40px)]" />
          <span className="face [transform:rotateX(-90deg)_translateZ(40px)]" />
        </div>
      </div>

      {/* Equalizer bars */}
      <div className="ambient-obj float-b bottom-[10%] left-[8%] opacity-50">
        <div className="eq3d">
          <span /><span /><span /><span /><span /><span />
        </div>
      </div>

      {/* Floating music-note glyphs */}
      <span className="ambient-obj material-symbols-outlined text-vibe-magenta float-c text-5xl top-[28%] left-[12%] opacity-25">music_note</span>
      <span className="ambient-obj material-symbols-outlined text-vibe-cyan float-a text-4xl top-[62%] right-[30%] opacity-20">graphic_eq</span>
      <span className="ambient-obj material-symbols-outlined text-vibe-violet float-d text-6xl bottom-[28%] left-[34%] opacity-20">album</span>
      <span className="ambient-obj material-symbols-outlined text-vibe-amber drift-a text-4xl top-[8%] right-[40%] opacity-20">queue_music</span>
    </div>
  );
}
