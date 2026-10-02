import api from './client';

export const getHealth = () => api.get('/api/health');

export const uploadAudio = (file, onProgress) => {
  const formData = new FormData();
  formData.append('audio', file);
  return api.post('/api/audio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
};

export const getJob = (jobId) => api.get(`/api/audio/jobs/${jobId}`);
/** `silent` suppresses the global error toast — for polling loops that report their own state. */
export const getResults = (jobId, { silent = false } = {}) => api.get(`/api/results/${jobId}`, { silent });
export const getHistory = (page = 1, limit = 20, filters = {}) =>
  api.get('/api/audio/history', { params: { page, limit, ...filters } });
export const deleteJob = (jobId) => api.delete(`/api/audio/jobs/${jobId}`);

export const searchSongs = (q, limit = 10) =>
  api.get('/api/audio/search', { params: { q, limit } });

export const analyzeUrl = (url, title, artist) =>
  api.post('/api/audio/analyze-url', { url, title, artist });

