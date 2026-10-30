import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Trash2, CheckCheck, CalendarCheck, CreditCard, KeyRound, CarFront,
  Banknote, XCircle, ShieldCheck, Info,
} from 'lucide-react';
import { AccountShell, ListSkeleton, ErrorBox } from '../components/account/AccountShell';
import { Card, EmptyState, Button, ConfirmDialog } from '../components/ui';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, clearAllNotifications,
} from '../api/notifications';
import { useDocumentMeta } from '../lib/seo';

const TYPES = {
  NEW_BOOKING: { icon: CalendarCheck, tone: 'bg-blue-50 text-blue-600' },
  PAYMENT: { icon: CreditCard, tone: 'bg-status-available-soft text-status-available' },
  CHECK_IN: { icon: KeyRound, tone: 'bg-brand-warning-soft text-brand-warning' },
  PICKUP: { icon: CarFront, tone: 'bg-brand-purple-soft text-brand-purple' },
  PAYOUT: { icon: Banknote, tone: 'bg-status-available-soft text-status-available' },
  CANCELLATION: { icon: XCircle, tone: 'bg-red-50 text-red-600' },
  HOST_APPROVAL: { icon: ShieldCheck, tone: 'bg-blue-50 text-blue-600' },
  SYSTEM: { icon: Info, tone: 'bg-brand-accent-soft text-brand-accent' },
};

const ago = (t) => {
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const errText = (e) => e?.response?.data?.message || e?.message || 'Please try again.';

export default function Notifications() {
  useDocumentMeta('Notifications', 'Updates about your bookings on Rentals Africa.');
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null);

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

  const confirmDelete = async () => {
    const id = confirm.id;
    setBusy(true);
    setNotice('');
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setNotice(`The notification could not be deleted. ${errText(e)}`);
    }
    setBusy(false);
    setConfirm(null);
  };

  const confirmClearAll = async () => {
    setBusy(true);
    setNotice('');
    const results = await clearAllNotifications(items.map((n) => n.id));
    const failed = results.filter((r) => r.status === 'rejected');
    try {
      setItems(await getNotifications());
    } catch {
      setError(true);
    }
    if (failed.length) {
      setNotice(`${failed.length} notification${failed.length > 1 ? 's' : ''} could not be deleted. ${errText(failed[0].reason)}`);
    }
    setBusy(false);
    setConfirm(null);
  };

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    try { await markAllNotificationsRead(); } catch { load(); }
  };

  const actions = items && items.length > 0 && (
    <div className="flex gap-3">
      {unread > 0 && (
        <Button variant="soft" size="sm" onClick={readAll}><CheckCheck className="w-4 h-4" /> Mark all read</Button>
      )}
      <Button variant="soft" size="sm" onClick={() => setConfirm({ all: true })}><Trash2 className="w-4 h-4" /> Clear all</Button>
    </div>
  );

  return (
    <AccountShell title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up.'} actions={actions}>
      {notice && (
        <div role="alert" className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-base text-red-700 font-medium">{notice}</div>
      )}
      {error ? (
        <ErrorBox message="We could not load your notifications." onRetry={load} />
      ) : items === null ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="You are all caught up" text="Booking confirmations, check-ins, payouts and approvals will appear here." />
        </Card>
      ) : (
        <Card className="divide-y divide-gray-100 overflow-hidden">
          {items.map((n) => {
            const t = TYPES[n.type] || TYPES.SYSTEM;
            const Icon = t.icon;
            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => open(n)}
                onKeyDown={(e) => e.key === 'Enter' && open(n)}
                className={`relative flex items-start gap-5 px-6 py-5 cursor-pointer transition-colors hover:bg-gray-50 ${n.isRead ? '' : 'bg-brand-primary-soft/40'}`}
              >
                {!n.isRead && <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.tone}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-lg text-brand-dark ${n.isRead ? 'font-semibold' : 'font-bold'}`}>{n.title}</p>
                    <span className="text-sm text-brand-text-muted whitespace-nowrap mt-1">{ago(n.createdAt)}</span>
                  </div>
                  <p className="text-base text-brand-text-secondary mt-1 leading-relaxed">{n.body}</p>
                </div>
                <button
                  aria-label="Delete notification"
                  onClick={(e) => { e.stopPropagation(); setConfirm({ id: n.id }); }}
                  className="p-2.5 rounded-full text-brand-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </Card>
      )}

      <ConfirmDialog
        open={!!confirm}
        danger
        busy={busy}
        title={confirm?.all ? 'Clear all notifications?' : 'Delete this notification?'}
        text={confirm?.all ? 'Every notification will be permanently removed. This cannot be undone.' : 'This notification will be permanently removed. This cannot be undone.'}
        confirmLabel={confirm?.all ? 'Clear all' : 'Delete'}
        onConfirm={confirm?.all ? confirmClearAll : confirmDelete}
        onCancel={() => !busy && setConfirm(null)}
      />
    </AccountShell>
  );
}
