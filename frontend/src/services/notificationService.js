import api from './api';

export const getNotifications = (skip = 0, limit = 50) => api.get('/notifications/', { params: { skip, limit } });
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');
