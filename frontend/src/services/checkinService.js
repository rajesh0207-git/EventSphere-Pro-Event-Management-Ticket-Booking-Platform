import api from './api';

export const scanQRCheckIn = (qrCodeData) => 
  api.post('/checkin/scan', { qr_code_data: qrCodeData });

export const getEventAttendance = (eventId) => 
  api.get(`/checkin/event/${eventId}/attendance`);

export const getEventAttendanceStats = (eventId) => 
  api.get(`/checkin/event/${eventId}/stats`);
