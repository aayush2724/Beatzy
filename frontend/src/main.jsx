import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const toastConfig = {
  style: {
    background: 'rgba(20, 20, 20, 0.92)',
    color: '#e5e2e1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '0.75rem',
    padding: '1rem 1.25rem'
  },
  success: {
    iconTheme: {
      primary: '#ffffff',
      secondary: '#050505'
    }
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff'
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={toastConfig}
      />
    </BrowserRouter>
  </React.StrictMode>
);
