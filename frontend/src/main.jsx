import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a27', color: '#fff', border: '1px solid #222233' },
          success: { iconTheme: { primary: '#3d6ef5', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
