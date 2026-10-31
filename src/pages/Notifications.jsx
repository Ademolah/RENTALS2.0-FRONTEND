import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Trash2, CheckCheck, CalendarCheck, CreditCard, KeyRound, CarFront,
  Banknote, XCircle, ShieldCheck, Info, X, ExternalLink,
} from 'lucide-react';
import { AccountShell, ListSkeleton, ErrorBox } from '../components/account/AccountShell';
import { Card, EmptyState, Button, ConfirmDialog } from '../components/ui';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, clearAllNotifications,
} from '../api/notifications';
import { useDocumentMeta } from '../lib/seo';
import { useToast } from '../components/Toast';

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

const hasToken = () => !!localStorage.getItem('rentals_token');

export default function Notifications() {
  useDocumentMeta('Notifications', 'Updates about your bookings on Rentals Africa.');
  const navigate = useNavigate();
  const [items, setItems] = useState(() => (hasToken() ? null : []));
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchItems = useCallback(() => getNotifications().then(setItems).catch(() => setError(true)), []);

  const load = useCallback(() => {
    setError(false);
    if (!hasToken()) return setItems([]);
    return fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (hasToken()) fetchItems();
  }, [fetchItems]);

  const unread = (items || []).filter((n) => !n.isRead).length;

  const open = (n) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markNotificationRead(n.id).catch(() => {});
    }
    setDetail({ ...n, isRead: true });
  };

  const openBooking = (n) => {
    setDetail(null);
    navigate(`/trips?booking=${encodeURIComponent(n.relatedId)}`);
  };

  const confirmDelete = async () => {
    const id = confirm.id;
    setBusy(true);
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setDetail((d) => (d && d.id === id ? null : d));
      toast.success('Notification deleted.');
    } catch (e) {
      toast.error(`The notification could not be deleted. ${errText(e)}`);
    }
    setBusy(false);
    setConfirm(null);
  };

  const confirmClearAll = async () => {
    setBusy(true);
    let failure = null;
    try {
      await clearAllNotifications();
    } catch (e) {
      failure = e;
    }
    try {
      setItems(await getNotifications());
    } catch {
      setError(true);
    }
    if (failure) toast.error(`Notifications could not be cleared. ${errText(failure)}`);
    else toast.success('All notifications cleared.');
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

      {detail && (() => {
        const t = TYPES[detail.type] || TYPES.SYSTEM;
        const Icon = t.icon;
        return (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-fade-up" onClick={() => setDetail(null)}>
            <div role="dialog" aria-modal="true" aria-label="Notification" className="w-full max-w-lg bg-white rounded-3xl shadow-elevated p-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.tone}`}><Icon className="w-7 h-7" /></div>
                <button aria-label="Close" onClick={() => setDetail(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <h2 className="mt-5 text-2xl font-display font-bold text-brand-dark">{detail.title}</h2>
              <p className="mt-1 text-sm text-brand-text-muted">{new Date(detail.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p className="mt-4 text-lg text-brand-text-secondary leading-relaxed whitespace-pre-line">{detail.body}</p>
              <div className="mt-8 flex flex-wrap gap-3 justify-end">
                <Button variant="outline" onClick={() => { setConfirm({ id: detail.id }); }}><Trash2 className="w-4 h-4" /> Delete</Button>
                {detail.relatedId && <Button onClick={() => openBooking(detail)}><ExternalLink className="w-4 h-4" /> Open booking</Button>}
              </div>
            </div>
          </div>
        );
      })()}

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
