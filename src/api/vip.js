import axios from 'axios';
import { apiClient } from './client';

// ==========================================
// VIP VENUES 
// ==========================================

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

export const initiateVipReservation = async (reservationData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip/reserve`, reservationData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteVipEstablishment = async (id) => {
  const token = localStorage.getItem('rentals_token');
  const response = await apiClient.delete(`/vip/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==========================================
// VIP SERVICES (New Module)
// ==========================================

export const getVipServices = async () => {
  const response = await apiClient.get(`/vip/services`);
  return response.data;
};

export const getVipServiceById = async (id) => {
  const response = await apiClient.get(`/vip/services/${id}`);
  return response.data;
};

export const initiateVipServiceReservation = async (reservationData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip/services/reserve`, reservationData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createVipService = async (formData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip/services`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
  });
};

export const logWhatsappIntent = async (intentData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/vip/whatsapp-intent`, intentData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};