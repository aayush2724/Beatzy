import api from './client';

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
export const getResults = (jobId) => api.get(`/api/results/${jobId}`);
export const getHistory = (page = 1, limit = 20, filters = {}) =>
  api.get('/api/audio/history', { params: { page, limit, ...filters } });
export const deleteJob = (jobId) => api.delete(`/api/audio/jobs/${jobId}`);

export const searchSongs = (q, limit = 10) =>
  api.get('/api/audio/search', { params: { q, limit } });

export const analyzeUrl = (url, title, artist) =>
  api.post('/api/audio/analyze-url', { url, title, artist });

export const pollForResults = async (jobId, maxAttempts = 60, intervalMs = 3000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await getResults(jobId);
    if (data.data?.status === 'completed' || data.data?.song_title !== undefined) {
      return data.data;
    }
    if (data.data?.status === 'failed') {
      throw new Error(data.data?.error_message || 'Analysis failed');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Analysis timed out');
};
