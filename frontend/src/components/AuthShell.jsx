import { Link } from 'react-router-dom';

/**
 * Shared layout for sign-in / sign-up — matches Landing (#1A1410, glass, headline type).
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1A1410] text-[#1A1410] font-body">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#1A1410_72%)] pointer-events-none" />
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.04) 0%, transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.03) 0%, transparent 50%)',
        }}
      />

      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-8">
        <Link to="/" className="font-headline text-lg tracking-[0.25em] text-[#1A1410] hover:text-gray-200 transition">
          BEATZY
        </Link>
        <div className="flex items-center gap-6 md:gap-10 text-xs tracking-[0.1em] uppercase text-gray-400">
          <Link to="/pricing" className="hover:text-[#1A1410] transition">
            Pricing
          </Link>
          <Link to="/" className="hover:text-[#1A1410] transition hidden sm:inline">
            Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6.5rem)] px-6 pb-16">
        <div className="w-full max-w-[560px] md:max-w-[600px]">
          <div
            className="rounded-2xl p-10 md:p-12 space-y-8"
            style={{
              background: 'rgba(20, 20, 20, 0.55)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65)',
            }}
          >
            <header className="text-center space-y-3">
              <p className="text-[10px] tracking-[0.35em] text-gray-500 uppercase">Beatzy</p>
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-[#1A1410]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-400 font-light max-w-md mx-auto">{subtitle}</p>
              )}
            </header>
            {children}
          </div>
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
