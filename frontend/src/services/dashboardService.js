import api from './api';

export const getOrganizerDashboard = () => api.get('/dashboard/organizer');
export const getOrganizerEventsBreakdown = () => api.get('/dashboard/organizer/events-breakdown');
export const getEventAnalytics = (eventId) => api.get(`/dashboard/event/${eventId}/analytics`);
export const getOrganizers = () => api.get('/dashboard/admin/organizers');
export const verifyOrganizer = (id) => api.put(`/dashboard/admin/organizers/${id}/verify`);
export const unverifyOrganizer = (id) => api.put(`/dashboard/admin/organizers/${id}/unverify`);
