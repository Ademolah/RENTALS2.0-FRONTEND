import axios from 'axios';
import { apiClient } from './client';


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

// Fetch hotels booked by the current guest
export const getMyHotelBookings = async () => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL;
  const response = await axios.get(`${baseURL}/hotels/guest/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Guest confirms they have checked into the hotel
export const confirmHotelGuestCheckIn = async (id) => {
  const token = localStorage.getItem('rentals_token');
  const baseURL = import.meta.env.VITE_API_URL;
  const response = await axios.patch(`${baseURL}/hotels/guest/bookings/${id}/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};