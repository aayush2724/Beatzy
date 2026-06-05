import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/ThemeToggle';
import { 
  ArrowUpRight, 
  Waves, 
  BrainCircuit, 
  Music2, 
  Fingerprint, 
  Radar, 
  Code2, 
  FileAudio, 
  Sparkles 
} from 'lucide-react';

export default function Landing() {
  const { token } = useAuthStore();
  const orbsRef = useRef([]);

  useEffect(() => {
    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Parallax orbs
    const onScroll = () => {
      const y = window.scrollY;
      orbsRef.current.forEach((orb, i) => {
        if (orb) {
          orb.style.transform = `translate3d(0, ${y * (i === 1 ? -0.045 : 0.06)}px, 0)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Tilt card effect
    const tiltCards = document.querySelectorAll('.tilt-card');
    const onMouseMove = (e, card) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -10;
      const ry = ((x / r.width) - 0.5) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px)`;
    };
    const onMouseLeave = (card) => {
      card.style.transform = '';
    };

    tiltCards.forEach((card) => {
      const moveHandler = (e) => onMouseMove(e, card);
      const leaveHandler = () => onMouseLeave(card);
      card.addEventListener('mousemove', moveHandler);
      card.addEventListener('mouseleave', leaveHandler);
      card._handlers = { moveHandler, leaveHandler };
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
      tiltCards.forEach((card) => {
        if (card._handlers) {
          card.removeEventListener('mousemove', card._handlers.moveHandler);
          card.removeEventListener('mouseleave', card._handlers.leaveHandler);
        }
      });
    };
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-transparent text-[#F5EFE7] antialiased selection:bg-[#C41E3A] selection:text-black noise relative font-sans">
      {/* Parallax Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#C41E3A]/15 blur-[140px]"></div>
        <div 
          ref={el => orbsRef.current[0] = el}
          className="absolute right-[-12rem] top-[20rem] h-[34rem] w-[34rem] rounded-full bg-[#A64D3D]/[0.1] blur-[120px]"
        ></div>
        <div 
          ref={el => orbsRef.current[1] = el}
          className="absolute bottom-[20rem] left-[-14rem] h-[38rem] w-[38rem] rounded-full bg-[#1A1410]/[0.08] blur-[130px]"
        ></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(45,27,77,0.15)_58%,transparent_100%)]"></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#1A1410]/10 bg-[#2A1A15]/80 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-[1720px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#C41E3A]/30 bg-[#C41E3A]/10 shadow-[0_0_35px_rgba(196,30,58,.16)]">
              <span className="absolute h-3 w-3 rounded-full bg-[#C41E3A] shadow-[0_0_22px_rgba(196,30,58,.8)]"></span>
              <span className="h-7 w-7 rounded-full border border-[#C41E3A]/50"></span>
            </span>
            <span className="text-sm font-semibold tracking-[0.38em] text-[#C41E3A]">BEATZY</span>
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            <a href="#features" onClick={scrollTo('#features')} className="text-[11px] font-medium tracking-[0.24em] text-[#C41E3A]/60 transition hover:text-[#C41E3A]">FEATURES</a>
            <a href="#how-it-works" onClick={scrollTo('#how-it-works')} className="text-[11px] font-medium tracking-[0.24em] text-[#C41E3A]/60 transition hover:text-[#C41E3A]">HOW IT WORKS</a>
            <a href="#examples" onClick={scrollTo('#examples')} className="text-[11px] font-medium tracking-[0.24em] text-[#C41E3A]/60 transition hover:text-[#C41E3A]">EXAMPLES</a>
            <Link to="/pricing" className="text-[11px] font-medium tracking-[0.24em] text-[#C41E3A]/60 transition hover:text-[#C41E3A]">PRICING</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!token && (
              <Link to="/login" className="hidden px-3 text-[11px] font-medium tracking-[0.22em] text-[#C41E3A]/60 transition hover:text-[#F5EFE7] sm:inline-flex">LOGIN</Link>
            )}
            <Link 
              to={token ? '/dashboard' : '/pricing'} 
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#C41E3A] px-5 text-xs font-black text-black shadow-[0_0_40px_rgba(196,30,58,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_0_70px_rgba(196,30,58,.38)]"
            >
              {token ? 'OPEN APP' : 'GET STARTED'}
            </Link>
          </div>
        </nav>
      </header>

      <main id="top" className="relative z-10">
        <section className="relative mx-auto flex min-h-[900px] max-w-[1720px] items-center px-5 py-20 sm:px-8 lg:px-10">
          <div className="absolute inset-x-5 top-10 hidden h-[690px] overflow-hidden rounded-[3rem] border border-[#1A1410]/5 bg-[#1A1410]/60 backdrop-blur-sm lg:block">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-px opacity-35">
              <div className="bg-[url(https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/e8da1c0d-9525-4140-9a56-be71e4c6001f/1780652168045-c4de8857/image.png)] bg-cover bg-center grayscale"></div>
              <div className="bg-white/[0.03]"></div>
              <div className="bg-[url(https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/e8da1c0d-9525-4140-9a56-be71e4c6001f/1780652181674-d54f5ae5/image.png)] bg-cover bg-center grayscale"></div>
              <div className="bg-white/[0.02]"></div>
              <div className="bg-white/[0.02]"></div>
              <div className="bg-[url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80)] bg-cover bg-center grayscale"></div>
              <div className="bg-white/[0.02]"></div>
              <div className="bg-[url(https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80)] bg-cover bg-center grayscale"></div>
              <div className="bg-[url(https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80)] bg-cover bg-center grayscale"></div>
              <div className="bg-white/[0.025]"></div>
              <div className="bg-[url(https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80)] bg-cover bg-center grayscale"></div>
              <div className="bg-white/[0.02]"></div>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,27,77,0.1),#1A1410_72%)]"></div>
          </div>

          <div className="relative grid w-full items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
            <div className="max-w-6xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#C41E3A]/20 bg-[#C41E3A]/5 px-4 py-2 text-[11px] font-medium tracking-[0.28em] text-[#C41E3A] shadow-[0_0_50px_rgba(196,30,58,.08)]">
                <span className="h-2 w-2 rounded-full bg-[#C41E3A] shadow-[0_0_16px_rgba(196,30,58,.9)]"></span>RESONANCE ENGINE — V4
              </div>
              <h1 className="hero-title max-w-7xl text-6xl font-black uppercase leading-[0.88] tracking-[-0.08em] text-[#C41E3A] sm:text-7xl md:text-8xl lg:text-[8.8rem]">
                <span>Decode</span><br />
                <span>the DNA</span><br />
                <span>of any song.</span>
              </h1>
              <p className="reveal mt-8 max-w-4xl text-lg leading-8 text-[#C41E3A]/60 sm:text-xl">
                Upload a track and Beatzy identifies the song, fingerprints the recording, then reveals BPM, key, mood, chords, genre vectors, and API-ready audio intelligence in seconds.
              </p>
              <div className="reveal mt-10 flex flex-col gap-4 sm:flex-row">
                <Link 
                  to={token ? '/upload' : '/register'} 
                  className="cta-3d inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#C41E3A] px-8 text-sm font-black uppercase tracking-[0.12em] text-black"
                >
                  Start analyzing<ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
                <a href="#examples" onClick={scrollTo('#examples')} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#1A1410]/10 bg-white/[0.04] px-8 text-sm font-semibold uppercase tracking-[0.12em] text-[#C41E3A] transition hover:border-[#C41E3A]/50 hover:text-[#C41E3A]">
                  View API demo
                </a>
              </div>
              <div className="reveal mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#1A1410]/10 bg-white/[0.035] p-4">
                  <p className="text-3xl font-black text-[#C41E3A]">100M+</p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-[#C41E3A]/60">TRACKS</p>
                </div>
                <div className="rounded-2xl border border-[#1A1410]/10 bg-white/[0.035] p-4">
                  <p className="text-3xl font-black text-[#C41E3A]">&lt;3s</p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-[#C41E3A]/60">ANALYSIS</p>
                </div>
                <div className="rounded-2xl border border-[#1A1410]/10 bg-white/[0.035] p-4">
                  <p className="text-3xl font-black text-[#C41E3A]">99%</p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-[#C41E3A]/60">ACCURACY</p>
                </div>
                <div className="rounded-2xl border border-[#1A1410]/10 bg-white/[0.035] p-4">
                  <p className="text-3xl font-black text-[#C41E3A]">6</p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-[#C41E3A]/60">DIMENSIONS</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto h-[620px] w-full max-w-[590px] perspective-[1200px]">
              <div className="orbit-dot absolute left-1/2 top-1/2 h-4 w-4 rounded-full bg-[#C41E3A] shadow-[0_0_26px_rgba(196,30,58,1)]"></div>
              
              <div className="float-card absolute left-8 top-12 w-72 rounded-[2rem] border border-[#1A1410]/10 bg-white/[0.06] p-5 backdrop-blur-2xl glow-orange">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.26em] text-[#C41E3A]/60">NOW SCANNING</span>
                  <Waves className="w-6 h-6 text-[#C41E3A]" />
                </div>
                <div className="equalizer flex h-32 items-end gap-2 rounded-2xl bg-[#2A1A15]/50 p-4">
                  <span className="w-full rounded-full bg-[#C41E3A]"></span>
                  <span className="w-full rounded-full bg-[#C41E3A]"></span>
                  <span className="w-full rounded-full bg-[#C41E3A]"></span>
                  <span className="w-full rounded-full bg-[#C41E3A]"></span>
                  <span className="w-full rounded-full bg-[#C41E3A]"></span>
                  <span className="w-full rounded-full bg-[#C41E3A]"></span>
                </div>
                <p className="mt-4 text-sm text-[#C41E3A]/60">Fingerprint match confidence</p>
                <p className="text-4xl font-black text-[#F5EFE7]">99.98%</p>
              </div>

              <div className="float-slow scanline absolute right-0 top-48 w-80 overflow-hidden rounded-[2rem] border border-[#C41E3A]/25 bg-[#2A1A15]/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,.6)] backdrop-blur-2xl">
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C41E3A] text-black">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.25em] text-[#C41E3A]/60">AI AUDIO MAP</p>
                      <p className="text-xl font-black text-[#F5EFE7]">Mood: Electric</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-[#C41E3A]/60"><span>Key detection</span><span className="text-[#C41E3A]">F# minor</span></div>
                      <div className="h-2 rounded-full bg-white/10"><div className="h-2 w-[84%] rounded-full bg-[#C41E3A]"></div></div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-[#C41E3A]/60"><span>Danceability</span><span className="text-[#C41E3A]">92</span></div>
                      <div className="h-2 rounded-full bg-white/10"><div className="h-2 w-[92%] rounded-full bg-[#C41E3A]"></div></div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-[#C41E3A]/60"><span>Chords</span><span className="text-[#C41E3A]">12 found</span></div>
                      <div className="h-2 rounded-full bg-white/10"><div className="h-2 w-[71%] rounded-full bg-[#C41E3A]"></div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="float-card absolute bottom-12 left-16 w-80 rounded-[2rem] border border-[#1A1410]/10 bg-white/[0.055] p-6 backdrop-blur-2xl" style={{ animationDelay: '-2.2s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.25em] text-[#C41E3A]/60">MATCH FOUND</p>
                    <p className="mt-1 text-2xl font-black text-[#F5EFE7]">Midnight Signal</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C41E3A]/40 bg-[#C41E3A]/10 text-[#C41E3A]">
                    <Music2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-[#2A1A15]/40 p-3">
                    <p className="text-xl font-black text-[#C41E3A]">128</p>
                    <p className="text-[9px] tracking-[0.18em] text-[#C41E3A]/60">BPM</p>
                  </div>
                  <div className="rounded-2xl bg-[#2A1A15]/40 p-3">
                    <p className="text-xl font-black text-[#C41E3A]">8A</p>
                    <p className="text-[9px] tracking-[0.18em] text-[#C41E3A]/60">CAMELOT</p>
                  </div>
                  <div className="rounded-2xl bg-[#2A1A15]/40 p-3">
                    <p className="text-xl font-black text-[#C41E3A]">0.92</p>
                    <p className="text-[9px] tracking-[0.18em] text-[#C41E3A]/60">ENERGY</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-20 -z-10 rounded-full border border-[#C41E3A]/10 shadow-[inset_0_0_80px_rgba(196,30,58,.05)]"></div>
              <div className="absolute inset-32 -z-10 rounded-full border border-[#1A1410]/10"></div>
            </div>
          </div>
        </section>

        <section aria-label="Platform statistics" className="relative border-y border-[#1A1410]/10 bg-[#1A1410] py-12">
          <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-4 px-5 md:grid-cols-4">
            {[
              { val: '100M+', lab: 'TRACKS IN DATABASE' },
              { val: '<3s', lab: 'AVG ANALYSIS SEC' },
              { val: '99.8%', lab: 'ID ACCURACY' },
              { val: '6', lab: 'AUDIO DIMENSIONS' }
            ].map((stat) => (
              <div key={stat.lab} className="tilt-card reveal rounded-[2rem] border border-[#1A1410]/10 bg-white/[0.035] p-7 text-center backdrop-blur-xl">
                <p className="text-5xl font-black tracking-tight text-[#C41E3A]">{stat.val}</p>
                <p className="mt-2 text-[10px] tracking-[0.24em] text-[#C41E3A]/60">{stat.lab}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="relative mx-auto max-w-[1720px] px-5 py-28 sm:px-8 lg:px-10">
          <div className="reveal mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-semibold tracking-[0.36em] text-[#C41E3A]/60">FEATURES</p>
            <h2 className="mt-4 text-5xl font-black uppercase tracking-[-0.06em] text-[#C41E3A] md:text-7xl">Music intelligence with depth.</h2>
            <p className="mt-5 text-lg leading-8 text-[#C41E3A]/60">Every component is built for recognition, enrichment, and API-scale delivery — wrapped in a cinematic interface that feels as fast as the engine underneath.</p>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              { icon: Fingerprint, title: 'Acoustic fingerprinting', text: 'Match noisy clips, live recordings, stems, and full tracks against a massive recognition layer engineered for sub-second lookup.' },
              { icon: Radar, title: 'AI audio dimensions', text: 'Extract tempo, key, mood, energy, rhythm density, vocal presence, chords, sections, and similarity vectors for discovery systems.' },
              { icon: Code2, title: 'SaaS-ready API', text: 'Drop Beatzy into streaming apps, rights workflows, DJ tools, creator platforms, and catalog intelligence products.' }
            ].map((feat, i) => (
              <article key={i} className="tilt-card reveal rounded-[2.5rem] border border-[#1A1410]/10 bg-white/[0.045] p-7 backdrop-blur-xl">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C41E3A] text-black shadow-[0_0_55px_rgba(196,30,58,.32)]">
                  <feat.icon className="w-8 h-8" />
                </div>
                <p className="text-[10px] tracking-[0.28em] text-[#C41E3A]/60">0{i + 1} / {feat.title.split(' ')[0].toUpperCase()}</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-[#F5EFE7]">{feat.title}</h3>
                <p className="mt-4 leading-7 text-[#C41E3A]/60">{feat.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="relative overflow-hidden border-y border-[#1A1410]/10 bg-[#1A1410] py-28">
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C41E3A]/[0.045] blur-[120px]"></div>
          <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8">
            <div className="reveal text-center">
              <p className="text-[11px] font-semibold tracking-[0.36em] text-[#C41E3A]/60">PIPELINE</p>
              <h2 className="mt-4 text-5xl font-black uppercase tracking-[-0.06em] text-[#C41E3A] md:text-7xl">How it works</h2>
            </div>
            <div className="relative mt-20 grid gap-6 lg:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-24 hidden h-px bg-gradient-to-r from-transparent via-[#C41E3A]/60 to-transparent lg:block"></div>
              {[
                { icon: FileAudio, title: 'Upload', text: 'Drop MP3, WAV, FLAC, stems, or short captured snippets into the engine.' },
                { icon: Waves, title: 'Analyze', text: 'Fingerprinting, source separation, chord inference, tempo grids, and mood models run together.' },
                { icon: Sparkles, title: 'Reveal', text: 'Return clean metadata, confidence scores, and structured JSON for product teams.' }
              ].map((step, i) => (
                <article key={i} className="tilt-card reveal relative rounded-[2.5rem] border border-[#1A1410]/10 bg-[#d8d2c4]/80 p-8 text-center backdrop-blur-xl">
                  <div className="step-badge mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C41E3A] text-2xl font-black text-black shadow-[0_0_70px_rgba(196,30,58,.35)]" style={{ animationDelay: `-${i * 2}s` }}>
                    0{i + 1}
                  </div>
                  <step.icon className="mx-auto mt-9 w-12 h-12 text-[#C41E3A]" />
                  <h3 className="mt-5 text-3xl font-black uppercase tracking-tight text-[#F5EFE7]">{step.title}</h3>
                  <p className="mt-4 leading-7 text-[#C41E3A]/60">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="examples" className="relative mx-auto grid max-w-[1720px] gap-10 px-5 py-28 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <div className="reveal">
            <p className="text-[11px] font-semibold tracking-[0.36em] text-[#C41E3A]/60">EXAMPLES</p>
            <h2 className="mt-4 text-5xl font-black uppercase tracking-[-0.06em] text-[#C41E3A] md:text-7xl">API output that sings.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#C41E3A]/60">Designed for developers who need a gorgeous dashboard and reliable machine-readable analysis. No guesswork. Just clean signal.</p>
          </div>
          <div className="tilt-card reveal overflow-hidden rounded-[2.5rem] border border-[#C41E3A]/25 bg-[#d8d2c4] shadow-[0_40px_140px_rgba(0,0,0,.65)]">
            <div className="flex items-center justify-between border-b border-[#1A1410]/10 bg-white/[0.03] px-6 py-4">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-zinc-600"></span>
                <span className="h-3 w-3 rounded-full bg-zinc-600"></span>
                <span className="h-3 w-3 rounded-full bg-[#C41E3A]"></span>
              </div>
              <p className="text-[10px] tracking-[0.26em] text-[#C41E3A]/60">beatzy.analysis.json</p>
            </div>
            <pre className="overflow-x-auto p-6 text-sm leading-7 text-[#44403c]">
              <code>{`{
  track_id: btz_9081x,
  match: Midnight Signal,
  confidence: 0.9998,
  bpm: 128,
  key: F# minor,
  mood: electric, focused,
  chords: [F#m, D, A, E],
  energy: 0.92,
  danceability: 0.88,
  api_latency_ms: 184
}`}</code>
            </pre>
          </div>
        </section>

        <section id="pricing" className="relative px-5 pb-28 sm:px-8 lg:px-10">
          <div className="reveal mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] border border-[#C41E3A]/25 bg-[#C41E3A] p-8 text-black shadow-[0_0_140px_rgba(196,30,58,.22)] md:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[11px] font-black tracking-[0.34em] text-black/55">START BUILDING</p>
                <h2 className="mt-3 max-w-5xl text-5xl font-black uppercase leading-[.92] tracking-[-0.07em] md:text-7xl">Turn every song into structured intelligence.</h2>
                <p className="mt-5 max-w-4xl text-lg font-medium leading-8 text-black/70">Launch with hosted analysis, dashboard uploads, and API access for recognition-first music products.</p>
              </div>
              <Link 
                to={token ? '/upload' : '/pricing'} 
                className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-[#1A1410] px-9 text-sm font-black uppercase tracking-[0.16em] text-[#C41E3A] shadow-[0_18px_0_rgba(0,0,0,.25)] transition hover:-translate-y-1"
              >
                Get started<ArrowUpRight className="ml-2 w-6 h-6" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#1A1410]/10 bg-[#1A1410] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1720px] flex-col items-center justify-between gap-5 md:flex-row">
          <p className="text-sm font-semibold tracking-[0.32em] text-[#C41E3A]">BEATZY</p>
          <p className="text-sm text-[#C41E3A]/60 text-center">Music intelligence engine for identification, analysis, and API access.</p>
          <div className="flex gap-5">
            <a href="#examples" onClick={scrollTo('#examples')} className="text-sm text-[#C41E3A]/60 transition hover:text-[#C41E3A]">Docs</a>
            <a href="#features" onClick={scrollTo('#features')} className="text-sm text-[#C41E3A]/60 transition hover:text-[#C41E3A]">Features</a>
            <Link to="/pricing" className="text-sm text-[#C41E3A]/60 transition hover:text-[#C41E3A]">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
