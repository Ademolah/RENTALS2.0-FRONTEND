import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck, Heart, Bell, Wallet, CreditCard, User, Phone, Trash2, AlertCircle,
  CheckCircle, Loader2, Crown, ChevronRight,
} from 'lucide-react';

import { AccountShell } from '../components/account/AccountShell';
import BookingCard from '../components/account/BookingCard';
import HostUpgradeModal from '../components/HostUpgradeModal';
import { Button, Card, Badge, SectionTitle } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { fetchGuestBookings } from '../api/trips';
import { getNotifications } from '../api/notifications';
import { getMyFavoritesApi, getMyProfileApi, updateMyProfileApi, deleteMyAccountApi } from '../api/user';
import { FEATURES } from '../lib/config';
import { useDocumentMeta } from '../lib/seo';

const INPUT = 'w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-base font-medium';
const LABEL = 'block text-sm font-bold uppercase tracking-wider text-brand-text-muted mb-2';

function Tile({ to, icon: Icon, label, value }) {
  return (
    <Link to={to} className="bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-card-hover transition-all p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-accent-soft flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-brand-dark" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-3xl font-display font-bold text-brand-dark leading-none">{value ?? '–'}</p>
        <p className="text-base text-brand-text-secondary mt-1">{label}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-brand-text-muted" />
    </Link>
  );
}

export default function GuestDashboard() {
  useDocumentMeta('My account', 'Manage your Rentals Africa account.');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState(null);
  const [savedCount, setSavedCount] = useState(null);
  const [unread, setUnread] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchGuestBookings().then(setBookings).catch(() => setBookings([]));
    getMyFavoritesApi().then((r) => setSavedCount((r?.data?.favorites || r?.favorites || []).length)).catch(() => setSavedCount(0));
    getNotifications().then((n) => setUnread(n.filter((x) => !x.isRead).length)).catch(() => setUnread(0));
    getMyProfileApi()
      .then((r) => {
        const u = r?.data?.user;
        if (u) setForm({ firstName: u.firstName || '', lastName: u.lastName || '', phoneNumber: u.phoneNumber || '' });
      })
      .catch(() => {});
  }, [user]);

  const upcoming = (bookings || []).filter((b) => b.bucket === 'upcoming');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await updateMyProfileApi(form);
      setNotice({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setNotice({ ok: false, text: err?.response?.data?.message || 'Could not update your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccountApi();
      logout();
      navigate('/');
    } catch (err) {
      setNotice({ ok: false, text: err?.response?.data?.message || 'Could not delete your account. Please close any active bookings first.' });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <AccountShell
      title={user?.firstName ? `Welcome back, ${user.firstName}` : 'My account'}
      subtitle="Your trips, saved stays and settings."
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <Tile to="/trips" icon={CalendarCheck} label="Upcoming trips" value={bookings ? upcoming.length : null} />
        <Tile to="/saved" icon={Heart} label="Saved stays" value={savedCount} />
        <Tile to="/notifications" icon={Bell} label="Unread notifications" value={unread} />
      </div>

      {upcoming.length > 0 && (
        <section className="mb-12">
          <div className="flex items-end justify-between">
            <SectionTitle title="Next up" />
            <Link to="/trips" className="text-base font-semibold text-brand-primary mb-6">See all trips</Link>
          </div>
          <div className="space-y-4">
            {upcoming.slice(0, 2).map((b) => <BookingCard key={b.id} booking={b} onOpen={() => navigate('/trips')} />)}
          </div>
        </section>
      )}

      {notice && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-base mb-6 ${notice.ok ? 'bg-status-available-soft text-status-available' : 'bg-red-50 text-red-700'}`}>
          {notice.ok ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {notice.text}
        </div>
      )}

      <section className="mb-12">
        <SectionTitle title="Profile" subtitle="Your name and phone are used on bookings." />
        <Card className="p-6 md:p-8 max-w-2xl">
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="fn">First name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                  <input id="fn" className={INPUT} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={LABEL} htmlFor="ln">Last name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                  <input id="ln" className={INPUT} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <label className={LABEL} htmlFor="ph">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                <input id="ph" type="tel" className={INPUT} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
            </div>
            <Button type="submit" variant="dark" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
            </Button>
          </form>
        </Card>
      </section>

      <section className="mb-12">
        <SectionTitle title="Payments and wallet" />
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          {[['Wallet', Wallet, FEATURES.wallet], ['Saved cards', CreditCard, FEATURES.savedCards]].map(([name, Icon, on]) => (
            <Card key={name} className="p-6 flex items-center gap-4">
              <Icon className="w-7 h-7 text-brand-text-muted" />
              <div className="flex-1">
                <p className="text-lg font-semibold text-brand-dark">{name}</p>
                {!on && <Badge tone="gray" className="mt-1">Coming soon</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <Card className="p-6 md:p-8 max-w-2xl flex items-center gap-5">
          <Crown className="w-8 h-8 text-brand-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xl font-display font-bold text-brand-dark">Become a host</p>
            <p className="text-base text-brand-text-secondary mt-1">List a property, car or VIP service and earn with Rentals Africa.</p>
          </div>
          <Button variant="dark" onClick={() => setUpgradeOpen(true)}>Apply</Button>
        </Card>
      </section>

      <section className="max-w-2xl">
        <div className="bg-red-50/60 rounded-2xl border border-red-100 p-6 md:p-8">
          <h2 className="text-xl font-display font-bold text-red-900 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Delete account</h2>
          <p className="text-base text-red-800/80 mt-2 mb-5">Permanently delete your account and all associated data. This cannot be undone.</p>
          <Button className="!bg-red-600 hover:!bg-red-700 !shadow-none" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete my account
          </Button>
        </div>
      </section>

      <HostUpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {deleteOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-elevated animate-fade-up">
            <h3 className="text-2xl font-display font-bold text-brand-dark">Delete your account?</h3>
            <p className="text-base text-brand-text-secondary mt-3 leading-relaxed">
              This permanently removes your profile and history. Any active bookings must be closed first.
            </p>
            <div className="flex gap-3 mt-7">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Keep account</Button>
              <Button className="flex-1 !bg-red-600 hover:!bg-red-700 !shadow-none" disabled={deleting} onClick={deleteAccount}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
