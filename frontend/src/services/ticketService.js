import api from './api';

export const getTickets = (eventId) => api.get(`/events/${eventId}/tickets`);
export const createTicket = (eventId, data) => api.post(`/events/${eventId}/tickets`, data);
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);
