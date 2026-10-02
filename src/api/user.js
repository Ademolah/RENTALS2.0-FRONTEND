import { apiClient } from './client';


export const toggleFavoriteApi = async (propertyId) => {
  const response = await apiClient.post(`/users/favorites/${propertyId}`); // Adjust route to match your setup
  return response.data;
};

export const getMyFavoritesApi = async () => {
  const response = await apiClient.get(`/users/favorites`);
  return response.data;
};

