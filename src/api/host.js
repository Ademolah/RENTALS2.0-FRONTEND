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

  getApplications: async () => {
    const response = await apiClient.get('/hosts/requests');
    return response.data;
  },


  processApplication: async (id, data) => {
    const response = await apiClient.patch(`/hosts/requests/${id}`, data);
    return response.data;
  },

  /**
   * @desc The host's real earnings for the current year, across all their listings.
   * Amounts are already the host's net 95% after the platform fee — show them as-is,
   * don't deduct anything further on the frontend. Same endpoint the mobile app uses,
   * so the numbers always match between web and mobile.
   */
  getAnalytics: async () => {
    const response = await apiClient.get('/hosts/analytics');
    return response.data;
  }
};