import { apiClient } from './client';

export const getProperties = async (filters = {}) => {
  // Convert filter object to query string (e.g., { category: 'SHORTLET' } -> ?category=SHORTLET)
  const params = new URLSearchParams(filters).toString();
  const response = await apiClient.get(`/properties?${params}`);
  return response.data;
};

export const getPropertyById = async (id) => {
  const response = await apiClient.get(`/properties/${id}`);
  return response.data;
};

export const createProperty = async (formData) => {
  const token = localStorage.getItem('rentals_token');

  const response = await apiClient.post('/properties', formData, {
    headers: {
      // Do NOT set 'Content-Type': 'multipart/form-data' here! 
      // Let Axios automatically set it with the correct boundary.
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};