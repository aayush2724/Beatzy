import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Results from './pages/Results';
import Pricing from './pages/Pricing';
import ApiKeys from './pages/ApiKeys';
import Profile from './pages/Profile';
import BillingSuccess from './pages/BillingSuccess';
import ArtistEchoes from './pages/ArtistEchoes';
import Admin from './pages/Admin';
import History from './pages/History';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/dashboard" replace />;
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return user?.is_admin ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  // Zustand persist hydrates synchronously from localStorage in modern browsers,
  // but we guard against the async case too.
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (!hydrated) {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/billing/success" element={<BillingSuccess />} />
      <Route path="/artist-echoes" element={<ArtistEchoes />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/history" element={<History />} />
        <Route path="/results/:jobId" element={<Results />} />
        <Route path="/api-keys" element={<ApiKeys />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
