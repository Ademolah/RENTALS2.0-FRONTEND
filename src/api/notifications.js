import { apiClient } from './client';

const skip = { _skipRedirect: true };

export const getNotifications = async () => {
  const response = await apiClient.get('/notifications', skip);
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await apiClient.patch(`/notifications/${id}/read`, null, skip);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all', null, skip);
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`/notifications/${id}`, skip);
  return response.data;
};
