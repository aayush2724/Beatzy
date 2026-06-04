import api from './client';

export const getFavorites = () => api.get('/api/library/favorites');
export const addFavorite = (jobId) => api.post(`/api/library/favorites/${jobId}`);
export const removeFavorite = (jobId) => api.delete(`/api/library/favorites/${jobId}`);
export const getCollections = () => api.get('/api/library/collections');
export const createCollection = (name) => api.post('/api/library/collections', { name });
export const addToCollection = (collectionId, jobId) =>
  api.post(`/api/library/collections/${collectionId}/items`, { jobId });
export const enableShare = (jobId) => api.post(`/api/library/share/${jobId}`);
export const disableShare = (jobId) => api.delete(`/api/library/share/${jobId}`);
export const exportReport = (jobId) =>
  api.get(`/api/results/${jobId}/export`, { responseType: 'blob' });
