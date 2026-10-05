import axios from 'axios';
import { apiClient } from './client';


export const createHotel = async (formData) => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL 

  const response = await apiClient.post(`${baseURL}/hotels`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};

export const getVipEstablishments = async () => {
  const response = await apiClient.get(`/vip`);
  return response.data;
};