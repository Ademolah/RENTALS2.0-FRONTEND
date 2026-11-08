import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Building2, CreditCard, ShieldCheck, Clock, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, Tag, Banknote, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HostService } from '../api/host';

const CONCIERGE_WHATSAPP = '2347063688222';
const STATE_OPTIONS = ['Lagos', 'Abuja'];

function Stage({ label, done, active }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
      ) : (
        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 ${active ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'}`} />
      )}
      <span className={`text-sm ${done || active ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>{label}</span>
    </div>
  );
}

function Benefit({ icon: Icon, title, body }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-primary" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function BecomeHost() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // 'checking' | 'IDLE' | 'PENDING' | 'REJECTED'
  const [status, setStatus] = useState('checking');
  const [notes, setNotes] = useState('');
  const [isRechecking, setIsRechecking] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ hostDisplayName: '', address: '', city: '', state: 'Lagos', nin: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already a host — nothing to apply for, send them to their real dashboard.
  useEffect(() => {
    const role = user?.role?.toUpperCase();
    if (role === 'LANDLORD' || role === 'ADMIN') navigate('/dashboard/landlord', { replace: true });
  }, [user, navigate]);

  const checkStatus = async () => {
    try {
      const res = await HostService.checkStatus();
      const dbStatus = res?.data?.status || 'IDLE';
      if (dbStatus === 'APPROVED') {
        // Approved server-side but our cached role hasn't caught up yet — refresh it and
        // go straight to the real dashboard instead of asking the host to sign out/in.
        await refreshUser();
        navigate('/dashboard/landlord', { replace: true });
        return;
      }
      setStatus(dbStatus);
      if (dbStatus === 'REJECTED') {
        setNotes(res?.data?.notes || '');
        setShowForm(true);
      }
    } catch {
      setStatus('IDLE');
    }
  };

  useEffect(() => { checkStatus(); }, []);

  const handleRecheck = async () => {
    setIsRechecking(true);
    await checkStatus();
    setIsRechecking(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.hostDisplayName.trim().length < 2) return setError('Enter your Host or Brand Name.');
    if (formData.address.trim().length < 5) return setError('Enter your home or office address.');
    if (formData.city.trim().length < 2) return setError('Enter your area, for example Lekki or Wuse.');
    if (!/^\d{11}$/.test(formData.nin)) return setError('Your NIN is the 11-digit number on your national ID.');

    setError('');
    setSubmitting(true);
    try {
      await HostService.applyToHost(formData);
      setStatus('PENDING');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already have a pending')) {
        setStatus('PENDING');
      } else {
        setError(msg || 'Could not submit your application right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = `https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(
    'Hello, I applied to become a host on Rentals Africa and would like an update on my application.'
  )}`;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
        <p className="absolute bottom-5 left-5 right-5 text-white text-sm font-bold">List your space on Rentals Africa</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Earn money sharing your space</h1>
          <p className="text-gray-500 font-medium mt-1.5">
            List your shortlet, hotel, car or VIP venue and start earning from guests in Lagos and Abuja.
          </p>
        </div>

        {/* Status-aware panel */}
        {status === 'checking' ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : status === 'PENDING' ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-black text-gray-900">Application under review</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Our team is verifying your details. Applications are reviewed within 24 hours. We'll notify you here and by email once you're approved, and you can then start listing.
            </p>
            <div className="space-y-3">
              <Stage done label="Application submitted" />
              <Stage active label="Identity review by Rentals Africa (within 24 hours)" />
              <Stage label="List your first property, vehicle or venue" />
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRecheck}
                disabled={isRechecking}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60"
              >
                {isRechecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Check status
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Ask the concierge
              </a>
            </div>
          </div>
        ) : !showForm ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900">Ready to list?</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Hosting needs a quick identity check. Tell us where you're based and your NIN. Applications are reviewed within 24 hours.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-primary/20"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-black text-gray-900">Apply to become a host</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">We verify every host before their first listing goes live.</p>
            </div>

            {status === 'REJECTED' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">
                  Your last application wasn't approved{notes ? `: ${notes}` : '.'} You can correct your details and apply again.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">
                  Host or Brand Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="hostDisplayName" required value={formData.hostDisplayName} onChange={handleChange}
                    placeholder="e.g. Demola & Demola Properties"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">
                  This will be publicly displayed on your future listings.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="address" required value={formData.address} onChange={handleChange}
                    placeholder="12 Admiralty Way"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">Area</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="city" required value={formData.city} onChange={handleChange}
                    placeholder="Lekki Phase 1"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">City</label>
                <select
                  name="state" value={formData.state} onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-bold text-gray-700 transition-all"
                >
                  {STATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">National Identification Number (NIN)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="nin" required maxLength={11} value={formData.nin}
                    onChange={(e) => handleChange({ target: { name: 'nin', value: e.target.value.replace(/\D/g, '') } })}
                    placeholder="11 digits"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-medium tracking-widest transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl p-3.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit application'}
              </button>
            </form>
          </div>
        )}

        {/* Benefits — always shown, matching the mobile app */}
        <div className="space-y-5 pt-2">
          <Benefit icon={Tag} title="Set your own prices" body="You decide what your place or car costs, and can change it any time." />
          <Benefit icon={ShieldCheck} title="Protected payments" body="Guests pay upfront. The money is held safely and released to you once check-in is confirmed." />
          <Benefit icon={Banknote} title="Direct bank payouts" body="Get paid straight into your Nigerian bank account once check-in is confirmed. A 5% platform fee applies." />
        </div>
      </div>
    </main>
  );
}
