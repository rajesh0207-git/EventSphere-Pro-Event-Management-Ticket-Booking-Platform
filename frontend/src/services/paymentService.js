import api from './api';

export const initiatePayment = (bookingId, method = 'CARD') => 
  api.post('/payments/initiate', { booking_id: bookingId, method });

export const confirmPayment = (paymentId, success = true) => 
  api.post(`/payments/confirm?payment_id=${paymentId}&success=${success}`);

export const getPaymentHistory = () => 
  api.get('/payments/history');

export const getPaymentDetails = (paymentId) => 
  api.get(`/payments/${paymentId}`);
