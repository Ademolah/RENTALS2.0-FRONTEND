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

// --- NEW AVAILABILITY CHECK ---
export const checkCarAvailability = async (id, dates) => {
  const response = await apiClient.post(`/cars/${id}/availability`, dates);
  return response.data;
};

export const createCar = async (formData) => {
  const token = localStorage.getItem('rentals_token');

  const baseURL = import.meta.env.VITE_API_URL

  const response = await axios.post(`${baseURL}/cars`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};

export const createCarReservation = async (reservationData) => {
  const response = await apiClient.post('/cars/book', reservationData); 
  return response.data;
};

export const confirmCarHandover = async (reservationId) => {
  const response = await apiClient.patch(`/cars/reservations/${reservationId}/handover`);
  return response.data;
};

export const getMyCarBookings = async () => {
  const response = await apiClient.get('/cars/my-bookings'); 
  return response.data;
};

export const getLandlordCarBookings = async () => {
  const response = await apiClient.get('/cars/landlord/bookings');
  return response.data;
};

export const updateCar = async (id, updateData) => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL;
  
  const response = await axios.patch(`${baseURL}/cars/${id}`, updateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};