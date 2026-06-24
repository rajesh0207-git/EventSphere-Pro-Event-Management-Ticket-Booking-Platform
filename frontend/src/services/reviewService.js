import api from './api';

export const getEventReviews = (eventId) => api.get(`/reviews/event/${eventId}`);
export const createReview = (eventId, data) => api.post(`/reviews/event/${eventId}`, data);
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);
