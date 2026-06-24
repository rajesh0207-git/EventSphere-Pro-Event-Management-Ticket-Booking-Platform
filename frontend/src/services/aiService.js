import api from './api';

export const getAIRecommendations = async () => {
    const response = await api.get('/ai/recommendations');
    return response.data;
};

export const chatWithAssistant = async (message) => {
    const response = await api.post('/ai/chat', { message });
    return response.data;
};
