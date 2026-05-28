import api from './client';

export function getStats() {
  return api.get('/api/admin/stats');
}

export function getUsers(page = 1, limit = 25) {
  return api.get('/api/admin/users', { params: { page, limit } });
}

export function updateUser(userId, data) {
  return api.patch(`/api/admin/users/${userId}`, data);
}

export function getAuditLogs(page = 1, limit = 50) {
  return api.get('/api/admin/audit-log', { params: { page, limit } });
}
