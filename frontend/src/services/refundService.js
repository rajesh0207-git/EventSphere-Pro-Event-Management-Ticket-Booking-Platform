import api from './api';

export const getRefunds = async () => {
    const response = await api.get('/refunds');
    return response.data;
};

export const requestRefund = async (data) => {
    const response = await api.post('/refunds', data);
    return response.data;
};

export const processRefund = async (id, status, adminNotes = '') => {
    const response = await api.put(`/refunds/${id}`, {
        status,
        admin_notes: adminNotes
    });
    return response.data;
};
