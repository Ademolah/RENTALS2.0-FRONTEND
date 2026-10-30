import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck, Clock, XCircle, Trash2, FileText, Lock, LifeBuoy, ChevronRight, Home, Plane, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Button, Badge, SectionTitle, EmptyState, WhatsAppIcon } from '../components/ui';
import InterestsPicker from '../components/profile/InterestsPicker';
import { useToast } from '../components/Toast';
import { CONCIERGE_WHATSAPP } from '../lib/config';
import AvatarUploader from '../components/profile/AvatarUploader';
import HostUpgradeModal from '../components/HostUpgradeModal';
import { getMyProfileApi, updateMyProfileApi, deleteMyAccountApi } from '../api/user';
import { HostService } from '../api/host';
import { useDocumentMeta } from '../lib/seo';

const INPUT = 'w-full px-4 py-3 text-base border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition disabled:bg-gray-50 disabled:text-brand-text-muted';
const LABEL = 'block text-sm font-semibold text-brand-dark mb-1.5';

function Field({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <input id={id} className={INPUT} {...props} />
    </div>
  );
}

const HOST_STATUS = {
  PENDING: { tone: 'amber', icon: Clock, text: 'Your host application is under review. We will notify you once it is approved.' },
  APPROVED: { tone: 'green', icon: ShieldCheck, text: 'You are an approved host. Manage your listings and bookings from the host dashboard.' },
  REJECTED: { tone: 'brand', icon: XCircle, text: 'Your last application was not approved. You can update your details and apply again.' },
};

export default function Profile() {
  const { user, loading: authLoading, setShowAuthModal, updateUser, logout } = useAuth();
  useDocumentMeta('Your profile');
  const toast = useToast();
  const [interests, setInterests] = useState({ lookingFor: [], offering: [] });
  const [savingInterests, setSavingInterests] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const [hostStatus, setHostStatus] = useState(null);
  const [hostModal, setHostModal] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isGuest = user && user.role !== 'LANDLORD' && user.role !== 'ADMIN';

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await getMyProfileApi();
        const u = res?.data?.user || res?.user || res?.data || {};
        if (!active) return;
        setForm({ firstName: u.firstName || '', lastName: u.lastName || '', phoneNumber: u.phoneNumber || '' });
        if (u.profilePicture) updateUser({ profilePicture: u.profilePicture });
        setInterests({ lookingFor: u.interests?.lookingFor || [], offering: u.interests?.offering || [] });
      } catch (err) {
        if (active) setLoadError(err.response?.data?.message || 'We could not load your profile. Please refresh.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const loadHostStatus = async () => {
    try {
      const res = await HostService.checkStatus();
      setHostStatus(res?.data?.status || null);
    } catch {
      setHostStatus(null);
    }
  };

  useEffect(() => {
    if (isGuest) loadHostStatus();
  }, [isGuest]);

  if (authLoading) {
    return <Container className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></Container>;
  }

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={Lock}
          title="Sign in to see your profile"
          text="Manage your details, photo and host application in one place."
          action={<Button onClick={() => setShowAuthModal(true)}>Sign in or register</Button>}
        />
      </Container>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setNotice(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) return setNotice({ type: 'error', text: 'First name is required.' });
    setSaving(true);
    setNotice(null);
    try {
      const res = await updateMyProfileApi({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || form.firstName.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      const u = res?.data?.user || res?.user || {};
      updateUser({ firstName: u.firstName ?? form.firstName.trim(), lastName: u.lastName ?? form.lastName.trim() });
      toast.success('Your details have been saved.');
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not save your changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const saveInterests = async () => {
    setSavingInterests(true);
    try {
      await updateMyProfileApi({ interests });
      updateUser({ interests });
      toast.success('Your preferences have been saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save your preferences. Please try again.');
    } finally {
      setSavingInterests(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setNotice(null);
    try {
      await deleteMyAccountApi();
      logout();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not delete your account. Please contact support.' });
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const status = HOST_STATUS[hostStatus];
  const StatusIcon = status?.icon;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'R';

  return (
    <div className="bg-gray-50 min-h-screen">
      <Container className="py-10 md:py-14">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-dark tracking-tight">Your profile</h1>
          <p className="text-lg text-brand-text-secondary mt-2">Update your details and manage your account.</p>
        </div>

        {notice && (
          <div role="status" className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-xl text-base font-medium ${notice.type === 'success' ? 'bg-status-available-soft text-status-available' : 'bg-red-50 text-status-booked'}`}>
            {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {notice.text}
          </div>
        )}

        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">
          <Card className="p-8 flex flex-col items-center text-center lg:sticky lg:top-32">
            <AvatarUploader
              src={user.profilePicture}
              initials={initials}
              onUploaded={(url) => { updateUser({ profilePicture: url }); toast.success('Profile photo updated.'); }}
            />
            <h2 className="mt-6 text-2xl font-display font-bold text-brand-dark">{user.firstName} {user.lastName}</h2>
            <p className="text-base text-brand-text-secondary break-all">{user.email}</p>
            <Badge tone={user.role === 'USER' ? 'gray' : 'dark'} className="mt-4">{user.role === 'USER' ? 'Guest' : user.role === 'ADMIN' ? 'Admin' : 'Host'}</Badge>
          </Card>

          <div className="space-y-8">
            <Card className="p-6 md:p-8">
              <SectionTitle title="Personal information" subtitle="Rentals Africa keeps your details private. They are never shown to hosts." />
              {loading ? (
                <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse-soft" />)}</div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  {loadError && <p className="text-base text-status-booked" role="alert">{loadError}</p>}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="First name" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" required />
                    <Field label="Last name" id="lastName" name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" />
                  </div>
                  <Field label="Email" id="email" value={user.email || ''} disabled readOnly />
                  <Field label="Phone number" id="phoneNumber" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange} autoComplete="tel" placeholder="+234 801 234 5678" />
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save changes'}
                  </Button>
                </form>
              )}
            </Card>

            <Card className="p-6 md:p-8">
              <SectionTitle title="What brings you here?" subtitle="Tell us what you want to do and we will tailor Rentals Africa for you." />
              <InterestsPicker value={interests} onChange={setInterests} />
              <Button className="mt-6" onClick={saveInterests} disabled={savingInterests}>
                {savingInterests ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save preferences'}
              </Button>
            </Card>

            {isGuest && (
              <Card className="p-6 md:p-8">
                <SectionTitle title="Become a host" subtitle="List shortlets, hotels, cars or VIP services and earn with Rentals Africa." />
                {status ? (
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 mb-5">
                    <StatusIcon className="w-6 h-6 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <Badge tone={status.tone}>{hostStatus}</Badge>
                      <p className="text-base text-brand-text-secondary mt-2">{status.text}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-base text-brand-text-secondary mb-5">Apply with your address and NIN. Our team reviews every application.</p>
                )}
                {hostStatus === 'APPROVED' ? (
                  <Button to="/dashboard/landlord"><Home className="w-5 h-5" /> Open host dashboard</Button>
                ) : (
                  <Button variant="dark" onClick={() => setHostModal(true)}>
                    {hostStatus === 'PENDING' ? 'View application' : hostStatus === 'REJECTED' ? 'Apply again' : 'Apply to host'}
                  </Button>
                )}
              </Card>
            )}

            <Card className="p-2 md:p-3">
              {[
                ['/trips', Plane, 'My trips and bookings'],
                ['/saved', Heart, 'Saved listings'],
                ['/terms', FileText, 'Terms of Service'],
                ['/privacy', Lock, 'Privacy Policy'],
                ['/help', LifeBuoy, 'Help and contact'],
              ].map(([to, Icon, label]) => (
                <Link key={to} to={to} className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-4 text-lg font-semibold text-brand-dark"><Icon className="w-5 h-5 text-brand-text-secondary" />{label}</span>
                  <ChevronRight className="w-5 h-5 text-brand-text-muted" />
                </Link>
              ))}
              <a href={`https://wa.me/${CONCIERGE_WHATSAPP}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-4 text-lg font-semibold text-brand-dark"><WhatsAppIcon className="w-5 h-5 text-[#25D366]" />Chat with the concierge</span>
                <ChevronRight className="w-5 h-5 text-brand-text-muted" />
              </a>
            </Card>

            <Card className="p-6 md:p-8 border-red-100">
              <h2 className="text-xl font-display font-bold text-brand-dark">Delete account</h2>
              <p className="text-base text-brand-text-secondary mt-2 mb-5">This permanently removes your account and cannot be undone.</p>
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleDelete} disabled={deleting} className="!bg-status-booked !shadow-none">
                    {deleting ? <><Loader2 className="w-5 h-5 animate-spin" /> Deleting...</> : <><Trash2 className="w-5 h-5" /> Yes, delete my account</>}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>Keep my account</Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setConfirmDelete(true)}><Trash2 className="w-5 h-5" /> Delete account</Button>
              )}
            </Card>
          </div>
        </div>
      </Container>

      <HostUpgradeModal isOpen={hostModal} onClose={() => { setHostModal(false); loadHostStatus(); }} />
    </div>
  );
}
