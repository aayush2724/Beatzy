import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-body px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="font-mono text-xs text-gray-500 uppercase tracking-widest hover:text-white transition mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="font-headline text-4xl uppercase tracking-tight mb-6">Terms of Service</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          By using Beatzy you agree to upload only audio you have the right to analyze. Do not use the service
          for unlawful purposes or to abuse rate limits.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Analysis results are provided as-is without warranty. Paid plans are billed per the pricing page;
          cancellations take effect at the end of the billing period.
        </p>
        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-12">
          Last updated June 2026 · Contact: legal@beatzy.app
        </p>
      </div>
    </div>
  );
}
