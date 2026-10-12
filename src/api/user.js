import { apiClient } from './client';

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