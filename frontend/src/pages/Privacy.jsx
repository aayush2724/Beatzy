import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-body px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="font-mono text-xs text-gray-500 uppercase tracking-widest hover:text-white transition mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="font-headline text-4xl uppercase tracking-tight mb-6">Privacy Policy</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Beatzy processes audio you upload solely to provide analysis results. We do not sell your data.
          Uploaded audio may be stored temporarily for processing and deleted per our retention policy.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Account data (email, name) is used for authentication and billing. Third-party services (Google OAuth,
          Stripe, AcoustID) receive only the data required for their function.
        </p>
        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-12">
          Last updated June 2026 · Contact: privacy@beatzy.app
        </p>
      </div>
    </div>
  );
}
