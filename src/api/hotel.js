import axios from 'axios';
import { apiClient } from './client';

/**
 * Fetch all hotels. 
 * Since Hotels and Shortlets live in the same database collection, 
 * we query the properties endpoint but automatically force the HOTEL category filter.
 */
export const getHotels = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  // Change this from /properties?category=HOTEL to /hotels
  const response = await apiClient.get(`/hotels?${params}`); 
  return response.data;
};
/**
 * Fetch a single hotel by ID.
 */
export const getHotelById = async (id) => {
  const response = await apiClient.get(`/hotels/${id}`);
  return response.data;
};

/**
 * Create a new Hotel.
 * Uses raw Axios to bypass standard JSON headers so the browser 
 * can perfectly construct the multipart/form-data boundary for Multer image uploads.
 */
export const createHotel = async (formData) => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL 

  const response = await axios.post(`${baseURL}/hotels`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};

/**
 * Update an existing Hotel.
 * Also uses raw Axios to support updating images.
 */
export const updateHotel = async (id, formData) => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL 

  const response = await axios.patch(`${baseURL}/hotels/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};

/**
 * Delete a Hotel.
 */
export const deleteHotel = async (id) => {
  const response = await apiClient.delete(`/hotels/${id}`);
  return response.data;
};

/**
 * Check availability for a specific room type within a hotel.
 * Pass dates as an object: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const checkHotelRoomAvailability = async (hotelId, roomTypeId, dates) => {
  const params = new URLSearchParams(dates).toString();
  const response = await apiClient.get(`/hotels/${hotelId}/rooms/${roomTypeId}/availability?${params}`);
  return response.data;
};

export const getLandlordHotelBookings = async () => {
  const token = localStorage.getItem('rentals_token');
  // Updated to point to the hotel routes
  const response = await apiClient.get('/hotels/landlord/bookings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const confirmHotelCheckIn = async (reservationId) => {
  const token = localStorage.getItem('rentals_token');
  // Updated to point to the hotel routes
  const response = await apiClient.post(`/hotels/bookings/${reservationId}/confirm-checkin`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getLandlordHotels = async () => {
  const token = localStorage.getItem('rentals_token');
  const response = await apiClient.get('/hotels/landlord/portfolio', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};