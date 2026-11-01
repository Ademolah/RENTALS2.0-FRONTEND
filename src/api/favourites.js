import { apiClient } from './client';

const skip = { _skipRedirect: true };

export const getFavourites = async () => {
  const response = await apiClient.get('/users/favorites', skip);
  return response.data;
};

export const toggleFavourite = async (listingId) => {
  const response = await apiClient.post(`/users/favorites/${listingId}`, null, skip);
  return response.data;
};
