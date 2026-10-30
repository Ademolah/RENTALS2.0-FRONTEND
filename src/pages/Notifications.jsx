import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { AccountShell, ListSkeleton, ErrorBox } from '../components/account/AccountShell';
import { Card, EmptyState, Button } from '../components/ui';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, clearAllNotifications,
} from '../api/notifications';
import { useDocumentMeta } from '../lib/seo';

const ago = (t) => {
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Notifications() {
  useDocumentMeta('Notifications', 'Updates about your bookings on Rentals Africa.');
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(false);
    if (!localStorage.getItem('rentals_token')) return setItems([]);
    getNotifications().then(setItems).catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  const unread = (items || []).filter((n) => !n.isRead).length;

  const open = (n) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.relatedId) navigate('/trips');
  };

  const remove = (e, id) => {
    e.stopPropagation();
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    deleteNotification(id).catch(() => setItems(snapshot));
  };

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    try { await markAllNotificationsRead(); } catch { load(); }
  };

  const clearAll = async () => {
    setBusy(true);
    const ids = items.map((n) => n.id);
    setItems([]);
    await clearAllNotifications(ids);
    load();
    setBusy(false);
  };

  const actions = items && items.length > 0 && (
    <div className="flex gap-3">
      {unread > 0 && (
        <Button variant="outline" size="sm" onClick={readAll}><CheckCheck className="w-4 h-4" /> Mark all read</Button>
      )}
      <Button variant="soft" size="sm" disabled={busy} onClick={clearAll}><Trash2 className="w-4 h-4" /> Clear all</Button>
    </div>
  );

  return (
    <AccountShell title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up.'} actions={actions}>
      {error ? (
        <ErrorBox message="We could not load your notifications." onRetry={load} />
      ) : items === null ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="No notifications" text="Booking updates and reminders will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => open(n)}
              onKeyDown={(e) => e.key === 'Enter' && open(n)}
              className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                n.isRead ? 'bg-white border-gray-100' : 'bg-white border-brand-primary/30 shadow-card'
              }`}
            >
              <span className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${n.isRead ? 'bg-gray-200' : 'bg-brand-primary'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-brand-dark">{n.title}</p>
                <p className="text-base text-brand-text-secondary mt-1 leading-relaxed">{n.body}</p>
                <p className="text-sm text-brand-text-muted mt-2">{ago(n.createdAt)}</p>
              </div>
              <button
                aria-label="Delete notification"
                onClick={(e) => remove(e, n.id)}
                className="p-2 rounded-full text-brand-text-muted hover:bg-gray-100 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
