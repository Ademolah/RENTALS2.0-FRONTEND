import axios from 'axios';
import { apiClient } from './client';

export const getProperties = async (filters = {}) => {
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

  // SURGICAL FIX: 
  // 1. Grab the base URL dynamically from your client so it matches your environment.
  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api/v1';

  // 2. Use RAW axios to bypass the apiClient's global JSON headers.
  // This allows the browser to perfectly construct the file boundary for Multer!
  const response = await axios.post(`${baseURL}/properties`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};