import api from './api';

export const createBooking = (data) => api.post('/bookings', data);
export const getMyBookings = () => api.get('/bookings/my-bookings');
export const cancelBooking = (id) => api.delete(`/bookings/${id}`);
