import api from './api';

export const addToWishlist = (eventId) => 
  api.post('/wishlist', { event_id: eventId });

export const removeFromWishlist = (eventId) => 
  api.delete(`/wishlist/${eventId}`);

export const getMyWishlist = () => 
  api.get('/wishlist');

export const checkWishlistStatus = (eventId) => 
  api.get(`/wishlist/check/${eventId}`);
