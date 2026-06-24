import api from './api';

export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getBIDashboard = () => api.get('/admin/bi-dashboard');
export const getAdminOrganizers = () => api.get('/dashboard/admin/organizers');
export const verifyOrganizer = (userId) => api.put(`/dashboard/admin/organizers/${userId}/verify`);
export const unverifyOrganizer = (userId) => api.put(`/dashboard/admin/organizers/${userId}/unverify`);
