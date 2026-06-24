import api from './api';

export const getEvents = (page = 1, perPage = 10) => api.get(`/events?page=${page}&per_page=${perPage}`);
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const toggleStream = (id) => api.put(`/events/${id}/toggle-stream`);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const getMyEvents = () => api.get('/events/organizer/my-events');
export const publishEvent = (id) => api.post(`/events/${id}/publish`);
export const getFeaturedEvents = (page = 1, perPage = 6) => api.get(`/events/featured?page=${page}&per_page=${perPage}`);
export const getTrendingEvents = (limit = 6) => api.get(`/events/trending?limit=${limit}`);
export const uploadBanner = (id, formData) => api.post(`/events/${id}/banner`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadGalleryImage = (id, formData, imageType = 'gallery') => api.post(`/events/${id}/gallery`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, params: { image_type: imageType } });
export const getEventImages = (id) => api.get(`/events/${id}/images`);
export const deleteImage = (imageId) => api.delete(`/events/images/${imageId}`);
