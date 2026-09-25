import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { initAnalytics, trackPageView } from './lib/analytics';
import { initSentry } from './lib/sentry';
import './index.css';

const toastConfig = {
  style: {
    // Tokens, so toasts follow the theme instead of staying near-black in light mode.
    background: 'var(--raised)',
    color: 'var(--ink)',
    border: '1px solid var(--line)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: '0.75rem',
    padding: '0.875rem 1.125rem',
    fontSize: '14px',
  },
  success: { iconTheme: { primary: 'var(--ok)', secondary: 'var(--ok-ink)' } },
  error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--danger-ink)' } },
};

function AnalyticsListener() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

initAnalytics();
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AnalyticsListener />
        <App />
        <Toaster position="top-right" toastOptions={toastConfig} />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
