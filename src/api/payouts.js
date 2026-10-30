import { apiClient } from "./client";

export const executePayout = async (bookingId) => {
  const response = await apiClient.post(`/payouts/execute/${bookingId}`, {});
  return response.data;
};
