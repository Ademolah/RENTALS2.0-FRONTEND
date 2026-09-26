// src/api/payouts.js
import { apiClient } from "./client";

export const executePayout = async (bookingId) => {
  const config = {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  };
  const response = await apiClient.post(`/payouts/execute/${bookingId}`, {}, config);
  return response.data;
};