import axios from 'axios';
import { apiClient } from './client';

export const getCars = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await apiClient.get(`/cars?${params}`);
  return response.data;
};

export const getCarById = async (id) => {
  const response = await apiClient.get(`/cars/${id}`);
  return response.data;
};

export const createCar = async (formData) => {
  const token = localStorage.getItem('rentals_token');

  // 1. Grab the base URL dynamically from your client so it matches your environment.
  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api/v1';

  // 2. Use RAW axios to bypass the apiClient's global JSON headers.
  // This allows the browser to perfectly construct the file boundary for Multer!
  const response = await axios.post(`${baseURL}/cars`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};