import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-[#28E0D4]/30 selection:text-black">
      <div className="max-w-3xl mx-auto px-8 py-24 space-y-16 animate-page-entrance">
        <Link to="/" className="group inline-flex items-center gap-2 font-mono text-[10px] text-white/30 uppercase tracking-widest hover:text-[#28E0D4] transition-colors">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Network
        </Link>

        <header className="space-y-6">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-[#28E0D4]/20 bg-[#28E0D4]/5 text-[#28E0D4] font-mono text-[9px] uppercase tracking-[0.2em]">
            <FileText className="w-3 h-3" /> Service Level Protocol
          </div>
          <h1 className="text-6xl font-display font-black text-white uppercase tracking-tighter leading-none">Terms of <span className="text-[#28E0D4] text-glow-cyan">Uplink</span></h1>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.3em]">Revision 4.2.0 · Neural Core Governance</p>
        </header>

        <div className="obsidian-panel p-12 rounded-[3rem] border border-white/5 space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <FileText className="w-64 h-64" />
          </div>

          <section className="space-y-6 relative z-10">
            <h3 className="font-display font-black text-xl text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#28E0D4]" />
                Resource Authorization
            </h3>
            <p className="text-on-surface-variant text-base leading-relaxed font-medium">
              By establishing an uplink with Beatzy, you agree to utilize neural bandwidth for authorized audio analysis only. Automated scraping, signal overloading, or attempted core penetration will result in immediate identifier termination.
            </p>
          </section>

          <section className="space-y-6 relative z-10">
            <h3 className="font-display font-black text-xl text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CFF]" />
                Liability Disclaimer
            </h3>
            <p className="text-on-surface-variant text-base leading-relaxed font-medium">
              Beatzy provides spectral intelligence "as-is". While our neural models aim for 99.9% accuracy, we are not responsible for identifier mismatches or signal latency within the global distributed network.
            </p>
          </section>

          <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-[9px] text-white/20 uppercase tracking-[0.2em] relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[#28E0D4] animate-pulse" />
                Governance Level: ENFORCED
            </div>
            <span>End of Transmission</span>
          </div>
        </div>

        <footer className="text-center pt-10">
            <p className="font-mono text-[9px] text-white/10 uppercase tracking-[0.4em]">Questions? uplink@beatzy.io · Node: Region-EU-1</p>
        </footer>
      </div>
    </div>
  );
}
