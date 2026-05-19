import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const stats = [
  { value: '< 5s', label: 'Avg analysis time' },
  { value: '99.9%', label: 'API uptime' },
  { value: '50M+', label: 'Songs in database' },
  { value: '13', label: 'Audio features extracted' },
];

const features = [
  {
    icon: 'waves',
    title: 'Song Identification',
    desc: 'Identify tracks through humming, radio snippets, or low-quality field recordings with surgical precision.',
    accent: 'secondary-fixed',
  },
  {
    icon: 'analytics',
    title: 'AI Audio Analysis',
    desc: 'Extract BPM, key, mood, energy levels, and genre classifications automatically using our neural engine.',
    accent: 'tertiary',
  },
  {
    icon: 'api',
    title: 'SaaS API',
    desc: 'Seamless integration for your apps. Scale from 100 to 100 million requests with enterprise-grade latency.',
    accent: 'secondary-fixed',
  },
  {
    icon: 'security',
    title: 'Enterprise Grade',
    desc: 'Dedicated clusters, custom SLAs, and high-security data processing for global organizations.',
    accent: 'tertiary',
  },
];

export default function Landing() {
  const navRef = useRef(null);
  const heroImageRef = useRef(null);

  useEffect(() => {
    function handleScroll() {
      const nav = navRef.current;
      if (!nav) return;

      if (window.scrollY > 50) {
        nav.classList.add('bg-surface/95');
        nav.classList.remove('bg-surface/80');
      } else {
        nav.classList.add('bg-surface/80');
        nav.classList.remove('bg-surface/95');
      }
    }

    function handleMouseMove(e) {
      const heroImage = heroImageRef.current;
      if (!heroImage) return;

      const x = (window.innerWidth - e.pageX * 2) / 100;
      const y = (window.innerHeight - e.pageY * 2) / 100;
      heroImage.style.transform = `translateX(${x}px) translateY(${y}px)`;
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden">
      <nav ref={navRef} className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_0_20px_rgba(0,245,255,0.05)] transition-colors">
        <div className="max-w-container-max mx-auto px-margin-desktop py-4 flex justify-between items-center">
          <Link to="/" className="font-headline-lg text-headline-lg tracking-tighter text-secondary-fixed-dim">
            Beatzy AI
          </Link>
          <div className="hidden md:flex space-x-8 items-center">
            <Link className="font-body-md text-body-md text-secondary-fixed-dim border-b-2 border-secondary-fixed-dim pb-1" to="/">
              Main Stage
            </Link>
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/artist-echoes">
              Inside the Wave
            </Link>
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/artist-echoes">
              Artist Echoes
            </Link>
            <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-all" to="/pricing">
              Production Suite
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="material-symbols-outlined text-on-surface hover:backdrop-brightness-125 cursor-pointer p-2 rounded-full transition-all">
              account_circle
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            ref={heroImageRef}
            alt="Atmospheric obsidian background"
            className="w-full h-full object-cover opacity-60"
            src="https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
        </div>

        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/10 border border-secondary-container/20 text-secondary-fixed-dim">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                electric_bolt
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest">Next-Gen Intelligence</span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-white max-w-xl">
              Identify. Analyze. <br />
              <span className="text-secondary-fixed-dim sonic-glow">Understand Music.</span>
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              The world's most advanced AI music engine. Decipher complex audio signatures, extract professional-grade metadata, and power your platform with precision spectral analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register" className="px-8 py-4 bg-secondary-fixed text-on-secondary font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                Start for free
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link to="/pricing" className="px-8 py-4 border border-tertiary-fixed-dim/40 text-white font-label-md text-label-md rounded-lg hover:bg-white/5 transition-all">
                View plans
              </Link>
            </div>
          </motion.div>

          <div className="relative group hidden lg:block">
            <div className="absolute -inset-4 bg-secondary-fixed-dim/10 rounded-xl blur-3xl group-hover:bg-secondary-fixed-dim/20 transition-all duration-700" />
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                alt="Cinematic close-up of a futuristic music production console with glowing lime-green faders and violet spectral data displays."
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnFoWz-xZavGd3dwGvFzZTJviV4YAVc3qUTQHNJLm5lf53eQJWP1F5DEcUtFwp2fGlqrQlLE0MozDcpSKyq4e4bihffkMug2KUifoyOv7e_kfqBhF-9nTEgr-YinBXRL40BmStnTcmgSUeOw5emrXKyUtlyBxleZwooNRJAXwW_09i00ZIa676kYx8njokQhogYEFX2u38QBHA8XcGVeXu_7ORQRE094QIqXzrbRWZNX6ITDIrEg_VtpjeBMW3DGvYEs4iHwM2jA"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 glass-card rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-label-sm text-label-sm text-secondary-fixed-dim mb-1">PROFILING DETECTED</p>
                    <p className="font-headline-lg text-headline-lg text-white">Legendary Signature</p>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1 h-6 bg-secondary-fixed animate-pulse"></div>
                    <div className="w-1 h-8 bg-secondary-fixed animate-pulse delay-75"></div>
                    <div className="w-1 h-4 bg-secondary-fixed animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-24 border-y border-outline-variant/10 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center md:text-left space-y-2">
                <div className="font-headline-xl text-headline-xl text-secondary-fixed sonic-glow">{value}</div>
                <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-tighter">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4">
              <h2 className="font-headline-lg text-headline-lg text-white">Everything you need</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                A full-stack ecosystem for music companies, developers, and producers to harness the power of spectral intelligence.
              </p>
            </div>
            <div className="h-px flex-1 bg-outline-variant/20 mb-3 mx-8 hidden md:block"></div>
            <div className="font-label-md text-label-md text-secondary-fixed-dim">PROTOCOL V2.4</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-8 rounded-xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className={`w-12 h-12 rounded-lg ${feature.accent === 'secondary-fixed' ? 'bg-secondary-fixed/10 border-secondary-fixed/20 text-secondary-fixed' : 'bg-tertiary/10 border-tertiary/20 text-tertiary'} border flex items-center justify-center`}>
                    <span className="material-symbols-outlined">{feature.icon}</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-white">{feature.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full lg:h-[600px]">
            <div className="lg:col-span-8 glass-card rounded-xl overflow-hidden relative group">
              <img
                alt="Visual representation of audio analysis in obsidian space"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                src="https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg"
              />
              <div className="relative z-10 p-12 flex flex-col justify-end h-full bg-gradient-to-t from-background via-transparent to-transparent">
                <h3 className="font-headline-xl text-headline-xl text-white mb-4">The Spectral Difference</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                  Our engine doesn't just listen—it understands. By mapping audio into a high-dimensional vector space, we can identify similarities invisible to the human ear.
                </p>
              </div>
            </div>
            <div className="lg:col-span-4 grid grid-rows-2 gap-4">
              <div className="glass-card p-8 rounded-xl border-l-4 border-secondary-fixed flex flex-col justify-center">
                <p className="font-label-sm text-label-sm text-secondary-fixed mb-2 uppercase">Precision Match</p>
                <div className="font-headline-lg text-headline-lg text-white">99.8% Accuracy</div>
              </div>
              <div className="glass-card p-8 rounded-xl border-l-4 border-tertiary flex flex-col justify-center">
                <p className="font-label-sm text-label-sm text-tertiary mb-2 uppercase">Global Reach</p>
                <div className="font-headline-lg text-headline-lg text-white">192 Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Dark textured obsidian background"
            className="w-full h-full object-cover opacity-30 grayscale"
            src="https://lh3.googleusercontent.com/aida/ADBb0uh-0FrOXxKO8zCLpEu9COZ0NjPhmB0M3CYTC6MslAizqy6oxpikKSbjwlpDXof1V0WMkPJ7cyidwHydp6SqsjFYeVEcmD12VIQik4t_eplJ4U5iYbjT0Rn5DNBDAA6ti-ldnBv36jMOHmtXuadMmlIS4uVbzY8bmdTU2FNk8GjctXeogZL1KXNqVRDSV-SEsugB75GEfoAj9Kp9n68EjvxslX-eaUZgS5bkumai5w1EuID5XvbiDZp5kg"
          />
          <div className="absolute inset-0 bg-background/90"></div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-desktop relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-headline-xl text-headline-xl text-white">Ready to synchronize with the future?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Join thousands of developers and music professionals building on the Beatzy AI architecture.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/register" className="px-12 py-5 bg-secondary-fixed text-on-secondary font-label-md text-label-md rounded-lg hover:brightness-110 shadow-xl transition-all">
                Create Account
              </Link>
              <Link to="/pricing" className="px-12 py-5 border border-outline text-white font-label-md text-label-md rounded-lg hover:bg-white/5 transition-all">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full py-12 border-t border-glass-border bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="font-headline-md text-headline-md text-on-surface">Beatzy AI</div>
            <div className="font-code-sm text-code-sm text-outline">© 2024 Beatzy AI. Protocols Reserved.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">
              Architecture
            </Link>
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">
              Privacy
            </Link>
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">
              API Documentation
            </Link>
            <Link className="font-code-sm text-code-sm text-outline hover:text-neon-cyan transition-colors" to="/">
              Terms of Resonance
            </Link>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-outline cursor-pointer hover:text-secondary-fixed">podcasts</span>
            <span className="material-symbols-outlined text-outline cursor-pointer hover:text-secondary-fixed">terminal</span>
            <span className="material-symbols-outlined text-outline cursor-pointer hover:text-secondary-fixed">share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
