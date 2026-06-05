import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const PUBLIC_PATHS = new Set(['/', '/pricing', '/login', '/register', '/artist-echoes', '/auth/callback', '/auth/error', '/billing/success', '/privacy', '/terms', '/status', '/docs']);

function isPublicPath() {
  return PUBLIC_PATHS.has(window.location.pathname);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    
    // Handle Render cold starts with retries on network/timeout errors
    const isNetworkError = !err.response && (err.code === 'ECONNABORTED' || err.message === 'Network Error');
    if (isNetworkError && !original._retryCount) {
      original._retryCount = 0;
    }

    if (isNetworkError && original._retryCount < 3) {
      original._retryCount++;
      const delay = 3000;
      toast.loading(`Reconnecting... (Attempt ${original._retryCount}/3)`, { id: 'api-retry', duration: delay });
      await new Promise(resolve => setTimeout(resolve, delay));
      if (original._retryCount === 3) toast.dismiss('api-retry');
      return api(original);
    }
    toast.dismiss('api-retry');

    if (err.response?.status === 401 && !original._authRetry) {
      original._authRetry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/refresh`, { refreshToken });
          setTokens(data.data.accessToken, data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          logout();
          if (!isPublicPath()) window.location.href = '/login';
        }
      } else {
        logout();
        if (!isPublicPath()) window.location.href = '/login';
      }
    }
    const message = err.response?.data?.error?.message || err.message || 'Something went wrong';
    if (err.response?.status !== 401) toast.error(message);
    return Promise.reject(err);
  }
);

export default api;
