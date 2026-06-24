import api from './api';

export const getConversations = () => api.get('/messages/conversations');
export const getChatHistory = (userId) => api.get(`/messages/${userId}`);
export const sendMessage = (userId, data) => api.post(`/messages/${userId}`, data);
