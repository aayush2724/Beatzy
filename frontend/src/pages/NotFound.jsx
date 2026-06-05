import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-accent font-body flex flex-col items-center justify-center px-6 text-center">
      <span className="font-display text-[8rem] leading-none text-[#1A1410]/5 font-bold">404</span>
      <h1 className="font-display text-3xl uppercase tracking-tight -mt-8 mb-4">Signal lost</h1>
      <p className="text-muted text-sm max-w-md mb-8">This frequency doesn&apos;t exist in our database.</p>
      <div className="flex gap-4">
        <Link to="/" className="btn-primary px-6 py-3 text-xs">Home</Link>
        <Link to="/upload" className="btn-secondary px-6 py-3 text-xs">Analyze</Link>
      </div>
    </div>
  );
}
