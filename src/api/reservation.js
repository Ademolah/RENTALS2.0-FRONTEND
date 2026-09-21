import { apiClient } from './client';

export const initiateBooking = async (bookingData) => {
  const response = await apiClient.post('/reservations/book', bookingData);
  return response.data;
};

export const getMyPropertyBookings = async () => {
  const response = await apiClient.get('/reservations/my-bookings');
  return response.data;
};

export const confirmCheckIn = async (reservationId) => {
  const response = await apiClient.patch(`/reservations/${reservationId}/confirm-checkin`);
  return response.data;
};