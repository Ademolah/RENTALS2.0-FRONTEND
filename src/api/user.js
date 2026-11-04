import axios from 'axios';
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

// Uses a raw axios call (not apiClient) so the default JSON Content-Type header
// doesn't interfere with the multipart boundary axios sets for FormData —
// same pattern as createProperty/updateProperty in api/properties.js.
export const updateMyProfilePictureApi = async (file) => {
  const token = localStorage.getItem('rentals_token');
  const formData = new FormData();
  formData.append('profilePicture', file);

  const response = await axios.patch(`${apiClient.defaults.baseURL}/users/me`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const removeMyProfilePictureApi = async () => {
  const response = await apiClient.patch('/users/me', { profilePicture: '' });
  return response.data;
};