import api from './client';

export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const refreshToken = (token) => api.post('/api/auth/refresh', { refreshToken: token });
export const getMe = () => api.get('/api/auth/me');
export const logout = () => api.post('/api/auth/logout');
export const googleLogin = () => {
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  window.location.href = `${baseUrl}/api/auth/google`;
};
