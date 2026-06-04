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
    background: 'rgba(20, 20, 20, 0.92)',
    color: '#e5e2e1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '0.75rem',
    padding: '1rem 1.25rem',
  },
  success: { iconTheme: { primary: '#ffffff', secondary: '#050505' } },
  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
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
