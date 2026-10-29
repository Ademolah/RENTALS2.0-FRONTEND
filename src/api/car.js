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

export const checkCarAvailability = async (id, dates) => {
  const response = await apiClient.post(`/cars/${id}/availability`, dates);
  return response.data;
};

export const createCar = async (formData) => {
  const response = await apiClient.post('/cars', formData);
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
  const response = await apiClient.patch(`/cars/${id}`, updateData);
  return response.data;
};

export const deleteCar = async (id) => {
  const response = await apiClient.delete(`/cars/${id}`);
  return response.data;
};

export const logCarWhatsappIntent = async (intentData) => {
  const response = await apiClient.post(`/cars/whatsapp-intent`, intentData);
  return response.data;
};