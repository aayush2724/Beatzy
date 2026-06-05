import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0D0808] text-[#FFFFFF] font-body selection:bg-[#FF6B35]/30 selection:text-black">
      <div className="max-w-3xl mx-auto px-8 py-24 space-y-16 animate-page-entrance">
        <Link to="/" className="group inline-flex items-center gap-2 font-mono text-[10px] text-[#FFFFFF]/30 uppercase tracking-widest hover:text-[#FF6B35] transition-colors">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Network
        </Link>

        <header className="space-y-6">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/5 text-[#FF6B35] font-mono text-[9px] uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3 h-3" /> Data Integrity Protocol
          </div>
          <h1 className="text-6xl font-display font-black text-[#FFFFFF] uppercase tracking-tighter leading-none">Privacy <span className="text-[#FF6B35] text-glow-orange">Protocol</span></h1>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.3em]">Revision 4.2.0 · Neural Core Standards</p>
        </header>

        <div className="obsidian-panel p-12 rounded-[3rem] border border-[#0D0808]/5 space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <ShieldCheck className="w-64 h-64" />
          </div>

          <section className="space-y-6 relative z-10">
            <h3 className="font-display font-black text-xl text-[#FFFFFF] uppercase tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                Signal Processing
            </h3>
            <p className="text-on-surface-variant text-base leading-relaxed font-medium">
              Beatzy processes audio signals solely to provide neural analysis results. We maintain a zero-sale policy regarding operator data. Signal signatures are extracted in real-time, and raw audio is purged per our retention protocols.
            </p>
          </section>

          <section className="space-y-6 relative z-10">
            <h3 className="font-display font-black text-xl text-[#FFFFFF] uppercase tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                Operator Identity
            </h3>
            <p className="text-on-surface-variant text-base leading-relaxed font-medium">
              Identifier data (email, alias) is used exclusively for neural core authentication and resource billing. Third-party uplinks (Google Auth, Stripe Protocol) receive only the minimum metadata required for secure operation.
            </p>
          </section>

          <div className="pt-10 border-t border-[#0D0808]/5 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-[9px] text-[#FFFFFF]/20 uppercase tracking-[0.2em] relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-pulse" />
                Uplink Encrypted: AES-256
            </div>
            <span>End of Transmission</span>
          </div>
        </div>

        <footer className="text-center pt-10">
            <p className="font-mono text-[9px] text-[#FFFFFF]/10 uppercase tracking-[0.4em]">Contact: privacy@beatzy.io · Node: Region-EU-1</p>
        </footer>
      </div>
    </div>
  );
}
