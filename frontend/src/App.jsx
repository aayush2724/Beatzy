import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import RouteFallback from './components/RouteFallback';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const AuthError = lazy(() => import('./pages/AuthError'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const Results = lazy(() => import('./pages/Results'));
const PublicResult = lazy(() => import('./pages/PublicResult'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));
const Profile = lazy(() => import('./pages/Profile'));
const BillingSuccess = lazy(() => import('./pages/BillingSuccess'));
const ArtistEchoes = lazy(() => import('./pages/ArtistEchoes'));
const Admin = lazy(() => import('./pages/Admin'));
const History = lazy(() => import('./pages/History'));
const Library = lazy(() => import('./pages/Library'));
const Compare = lazy(() => import('./pages/Compare'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Status = lazy(() => import('./pages/Status'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/upload" replace />;
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return user?.is_admin ? children : <Navigate to="/upload" replace />;
}

function LazyPage({ children }) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  if (!hydrated) return <RouteFallback />;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LazyPage><Landing /></LazyPage>} />
        <Route path="/r/:shareToken" element={<LazyPage><PublicResult /></LazyPage>} />
        <Route path="/pricing" element={<LazyPage><Pricing /></LazyPage>} />
        <Route path="/status" element={<LazyPage><Status /></LazyPage>} />
        <Route path="/docs" element={<LazyPage><ApiDocs /></LazyPage>} />
        <Route path="/login" element={<LazyPage><PublicRoute><Login /></PublicRoute></LazyPage>} />
        <Route path="/register" element={<LazyPage><PublicRoute><Register /></PublicRoute></LazyPage>} />
        <Route path="/auth/callback" element={<LazyPage><AuthCallback /></LazyPage>} />
        <Route path="/auth/error" element={<LazyPage><AuthError /></LazyPage>} />
        <Route path="/privacy" element={<LazyPage><Privacy /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><Terms /></LazyPage>} />
        <Route path="/billing/success" element={<LazyPage><BillingSuccess /></LazyPage>} />
        <Route path="/artist-echoes" element={<LazyPage><ArtistEchoes /></LazyPage>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
          <Route path="/upload" element={<LazyPage><Upload /></LazyPage>} />
          <Route path="/history" element={<LazyPage><History /></LazyPage>} />
          <Route path="/library" element={<LazyPage><Library /></LazyPage>} />
          <Route path="/compare" element={<LazyPage><Compare /></LazyPage>} />
          <Route path="/results/:jobId" element={<LazyPage><Results /></LazyPage>} />
          <Route path="/api-keys" element={<LazyPage><ApiKeys /></LazyPage>} />
          <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
          <Route path="/admin" element={<LazyPage><AdminRoute><Admin /></AdminRoute></LazyPage>} />
        </Route>
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
}
