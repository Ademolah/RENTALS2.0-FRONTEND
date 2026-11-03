import { apiClient } from './client';

const CONCIERGE_WHATSAPP = '2347063688222';

export const initiateWhatsAppBooking = async (intentData) => {
  const response = await apiClient.post('/reservations/whatsapp-intent', intentData);
  return response.data;
};

export const openWhatsApp = (reference, listing, details) => {
  const message = [
    `Hi, I'd like to book:`,
    `📌 ${listing.title}`,
    details.dates ? `📅 ${details.dates}` : '',
    details.guests ? `👥 ${details.guests} guest(s)` : '',
    details.price ? `💰 ${details.price}` : '',
    reference ? `🔖 Reference: ${reference}` : '',
  ].filter(Boolean).join('\n');

  const url = `https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
