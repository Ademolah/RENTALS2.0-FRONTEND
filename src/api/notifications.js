import { apiClient } from './client';

// The live server has no working DELETE /notifications/:id (404), so deleted ids
// are remembered on this device and filtered out. Remove once the route exists.
const HIDDEN_KEY = 'rentals_hidden_notifications';

const readHidden = () => {
  try {
    const v = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
    return new Set(Array.isArray(v) ? v : []);
  } catch {
    return new Set();
  }
};

const hide = (id) => {
  try {
    const set = readHidden();
    set.add(id);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set].slice(-500)));
  } catch {
    /* storage unavailable */
  }
};

export async function getNotifications() {
  const res = await apiClient.get('/notifications');
  const raw = res.data?.data?.notifications || [];
  const hidden = readHidden();
  const items = raw
    .map((n) => ({
      id: String(n._id),
      title: String(n.title ?? ''),
      body: String(n.body ?? ''),
      type: String(n.type ?? 'SYSTEM'),
      relatedId: n.relatedId ? String(n.relatedId) : undefined,
      isRead: n.isRead === true,
      createdAt: Date.parse(n.createdAt) || 0,
    }))
    .filter((n) => !hidden.has(n.id));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export const markNotificationRead = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => apiClient.patch('/notifications/read-all');

export async function deleteNotification(id) {
  try {
    await apiClient.delete(`/notifications/${id}`);
  } catch (e) {
    if (e?.response?.status !== 404) throw e;
  }
  hide(id);
}

export const clearAllNotifications = (ids) => Promise.allSettled(ids.map((id) => deleteNotification(id)));
