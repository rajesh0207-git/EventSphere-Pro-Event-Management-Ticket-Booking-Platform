import api from './api';

export const listCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const deleteCoupon = (couponId) => api.delete(`/coupons/${couponId}`);
export const validateCoupon = (code, eventId) => api.get(`/coupons/validate/${code}/${eventId}`);
