import { apiClient } from './client';

export const getHotels = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await apiClient.get(`/hotels?${params}`); 
  return response.data;
};

export const getHotelById = async (id) => {
  const response = await apiClient.get(`/hotels/${id}`);
  return response.data;
};

export const createHotel = async (formData) => {
  const response = await apiClient.post(`/hotels`, formData);
  return response.data;
};

export const updateHotel = async (id, formData) => {
  const response = await apiClient.patch(`/hotels/${id}`, formData);
  return response.data;
};

export const deleteHotel = async (id) => {
  const response = await apiClient.delete(`/hotels/${id}`);
  return response.data;
};

export const checkHotelRoomAvailability = async (hotelId, roomTypeId, dates) => {
  const params = new URLSearchParams(dates).toString();
  const response = await apiClient.get(`/hotels/${hotelId}/rooms/${roomTypeId}/availability?${params}`);
  return response.data;
};

export const getLandlordHotelBookings = async () => {
  const response = await apiClient.get('/hotels/landlord/bookings');
  return response.data;
};

export const confirmHotelCheckIn = async (reservationId) => {
  const response = await apiClient.post(`/hotels/bookings/${reservationId}/confirm-checkin`, {});
  return response.data;
};

export const getLandlordHotels = async () => {
  const response = await apiClient.get('/hotels/landlord/portfolio');
  return response.data;
};

export const getMyHotelBookings = async () => {
  const response = await apiClient.get(`/hotels/guest/bookings`);
  return response.data;
};

export const confirmHotelGuestCheckIn = async (id) => {
  const response = await apiClient.patch(`/hotels/guest/bookings/${id}/confirm`, {});
  return response.data;
};

export const logHotelWhatsappIntent = async (intentData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post(`/hotels/whatsapp-intent`, intentData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};