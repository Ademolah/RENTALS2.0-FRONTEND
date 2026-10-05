import axios from 'axios';
import { apiClient } from './client';


export const createVipEstablishment = async (formData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
  });
};

export const getVipEstablishments = async () => {
  const response = await apiClient.get(`/vip`);
  return response.data;
};

export const getVipEstablishmentById = async (id) => {
  const response = await apiClient.get(`/vip/${id}`);
  return response.data;
};

export const getLandlordVipEstablishments = async () => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.get(`/vip/landlord`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const confirmVipArrival = async (reservationId) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip/confirm-arrival/${reservationId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateVipEstablishment = async (id, formData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.put(`/vip/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
  });
};

// Add this to your src/api/vip.js
export const initiateVipReservation = async (reservationData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip/reserve`, reservationData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};