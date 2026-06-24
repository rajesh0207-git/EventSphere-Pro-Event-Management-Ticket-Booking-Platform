import api from './api';

export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);
export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
