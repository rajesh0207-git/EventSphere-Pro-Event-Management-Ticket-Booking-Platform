import api from './api';

export const getSeatsForEvent = (eventId) => 
  api.get(`/seats/event/${eventId}`);

export const reserveSeat = (seatId) => 
  api.post('/seats/reserve', { seat_id: seatId });

export const releaseSeatReservation = (seatId) => 
  api.delete(`/seats/${seatId}/release`);

export const getAvailableSeatsCount = (eventId) => 
  api.get(`/seats/event/${eventId}/available`);
