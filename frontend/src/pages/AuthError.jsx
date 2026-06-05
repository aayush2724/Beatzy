import { Link } from 'react-router-dom';

export default function AuthError() {
  return (
    <div className="min-h-screen bg-[#120509] text-white font-body flex flex-col items-center justify-center px-6 text-center">
      <span className="material-symbols-outlined text-5xl text-red-400/80 mb-6">error</span>
      <h1 className="font-headline text-3xl uppercase tracking-tight mb-4">Sign-in failed</h1>
      <p className="text-gray-400 text-sm max-w-md mb-8">
        Google authentication did not complete. Check that OAuth is configured on the server, or try email sign-in.
      </p>
      <div className="flex gap-4">
        <Link to="/login" className="btn-primary px-6 py-3 text-xs">Try again</Link>
        <Link to="/" className="btn-secondary px-6 py-3 text-xs">Home</Link>
      </div>
    </div>
  );
}
