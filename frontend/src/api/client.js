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
    const original = err.config || {};
    // Callers that poll or probe pass `{ silent: true }` so a transient
    // failure doesn't raise a toast on every tick; they handle it themselves.
    const silent = Boolean(original.silent);

    // Handle Render cold starts with retries on network/timeout errors
    const isNetworkError = !err.response && (err.code === 'ECONNABORTED' || err.message === 'Network Error');
    if (isNetworkError && !original._retryCount) {
      original._retryCount = 0;
    }

    if (isNetworkError && original._retryCount < 3) {
      original._retryCount++;
      const delay = 3000;
      if (!silent) toast.loading(`Reconnecting... (Attempt ${original._retryCount}/3)`, { id: 'api-retry', duration: delay });
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
    // Server messages for 4xx are written for users; anything else gets a
    // generic line so internal details never surface in the UI.
    const status = err.response?.status;
    const serverMessage = err.response?.data?.error?.message;
    const message =
      status && status < 500 && serverMessage
        ? serverMessage
        : status >= 500
          ? 'The server hit a problem. Please try again in a moment.'
          : !err.response
            ? "Couldn't reach the server. Check your connection and try again."
            : 'Something went wrong';
    if (!silent && status !== 401) toast.error(message, { id: `api-error-${status || 'network'}` });
    return Promise.reject(err);
  }
);

export default api;
