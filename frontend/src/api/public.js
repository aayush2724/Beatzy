import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

export const getPublicResult = (shareToken) =>
  axios.get(`${baseURL}/api/public/r/${shareToken}`);

export const getSystemStatus = () =>
  axios.get(`${baseURL}/api/public/status`);
