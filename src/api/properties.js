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

export const updateProperty = async (id, updateData) => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL;
  
  const response = await axios.patch(`${baseURL}/properties/${id}`, updateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// --- NEW AVAILABILITY CHECK ---
export const checkPropertyAvailability = async (id, dates) => {
  const response = await apiClient.post(`/properties/${id}/availability`, dates);
  return response.data;
};

export const createProperty = async (formData) => {
  const token = localStorage.getItem('rentals_token');

  const baseURL = import.meta.env.VITE_API_URL 

  const response = await axios.post(`${baseURL}/properties`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};

export const confirmPropertyCheckIn = async (reservationId) => {
  const response = await apiClient.patch(`/reservations/${reservationId}/confirm-checkin`);
  return response.data;
};

export const getLandlordPropertyBookings = async () => {
  const response = await apiClient.get('/properties/landlord-bookings');
  return response.data;
};