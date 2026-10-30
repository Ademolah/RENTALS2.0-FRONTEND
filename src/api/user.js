import { apiClient } from './client';
import { getNotifications } from './notifications';

export const toggleFavoriteApi = async (propertyId) => {
  const response = await apiClient.post(`/users/favorites/${propertyId}`); 
  return response.data;
};

export const getMyFavoritesApi = async () => {
  const response = await apiClient.get(`/users/favorites`);
  return response.data;
};


export const getMyProfileApi = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};


export const updateMyProfileApi = async (profileData) => {
  const response = await apiClient.patch('/users/me', profileData);
  return response.data;
};


export const deleteMyAccountApi = async () => {
  const response = await apiClient.delete('/users/me');
  return response.data;
};

export const uploadAvatarApi = async (blob) => {
  const form = new FormData();
  form.append('image', blob, 'avatar.jpg');
  const response = await apiClient.patch('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
};

export const getUnreadCountApi = async () => {
  const items = await getNotifications();
  return items.filter((n) => !n.isRead).length;
};
