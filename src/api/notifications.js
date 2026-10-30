import { apiClient } from './client';

export async function getNotifications() {
  const res = await apiClient.get('/notifications');
  const raw = res.data?.data?.notifications || [];
  const items = raw.map((n) => ({
    id: String(n._id),
    title: String(n.title ?? ''),
    body: String(n.body ?? ''),
    type: String(n.type ?? 'SYSTEM'),
    relatedId: n.relatedId ? String(n.relatedId) : undefined,
    isRead: n.isRead === true,
    createdAt: Date.parse(n.createdAt) || 0,
  }));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export const markNotificationRead = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => apiClient.patch('/notifications/read-all');
export const deleteNotification = (id) => apiClient.delete(`/notifications/${id}`);
export const clearAllNotifications = (ids) => Promise.allSettled(ids.map((id) => deleteNotification(id)));
