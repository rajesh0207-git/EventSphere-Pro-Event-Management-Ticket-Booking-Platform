import api from './api';

export const searchEvents = (params) => api.get('/search', { params });
