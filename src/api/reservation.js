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


export const cancelBookingApi = async (reservationId) => {
  const response = await apiClient.post(`/reservations/${reservationId}/cancel`);
  return response.data;
};

export const logUnifiedWhatsappIntent = async (intentData) => {
  return apiClient.post(`/reservations/whatsapp-intent`, intentData);
};

const DRAFT_KEY = 'rentals_checkout_draft';

export const saveCheckoutDraft = (draft) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable */
  }
};

export const loadCheckoutDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
};

export const clearCheckoutDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable */
  }
};
