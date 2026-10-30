import { apiClient } from './client';

export const HostService = {
  /**
   * @desc Submit a new host application (Guest)
   */
  applyToHost: async (applicationData) => {
    const response = await apiClient.post('/hosts/apply', applicationData);
    return response.data;
  },

  checkStatus: async () => {
    const response = await apiClient.get('/hosts/status');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/hosts/analytics');
    return response.data;
  },

  getApplications: async () => {
    const response = await apiClient.get('/hosts/requests');
    return response.data;
  },


  processApplication: async (id, data) => {
    const response = await apiClient.patch(`/hosts/requests/${id}`, data);
    return response.data;
  },

  // Cancels any kind of reservation; the payment goes to Rentals Africa for review and refund.
  cancelReservation: async (id) => {
    const response = await apiClient.post(`/reservations/${id}/cancel`);
    return response.data;
  }
};