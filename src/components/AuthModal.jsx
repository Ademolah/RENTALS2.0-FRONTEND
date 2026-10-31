import { useState, useEffect } from 'react';
import { API_URL } from '../lib/config';
import { createPortal } from 'react-dom';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { registerUser as registerUserApi } from '../api/auth';
import ForgotPasswordModal from './ForgotPasswordModal';
import { VerifyEmailModal } from './VerifyEmailModal';
import InterestsPicker from './profile/InterestsPicker';
import { useToast } from './Toast';

const INPUT = 'w-full px-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-base font-medium transition-all';
const LABEL = 'block text-xs font-extrabold uppercase tracking-widest text-gray-500 mb-1.5';

function Field({ label, error, children, right }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-xs font-extrabold uppercase tracking-widest text-gray-500">{label}</label>
        {right}
      </div>
      {children}
      {error && <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

const borderFor = (err) => (err ? 'border-red-300' : 'border-gray-200');

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { login, completeSignIn, finishSignIn } = useAuth();
  const toast = useToast();

  const [dialCode, setDialCode] = useState('+234');
  const [localPhone, setLocalPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [newUser, setNewUser] = useState(null);
  const [interests, setInterests] = useState({ lookingFor: [], offering: [] });
  const [savingInterests, setSavingInterests] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phoneNumber: '', role: 'USER',
  });

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setGoogleLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/auth/google`, {
        idToken: tokenResponse.credential,
      });
      const { token, data } = res.data;
      completeSignIn(token, data.user);
      finishSignIn(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const resetAndClose = () => {
    setNewUser(null);
    onClose();
  };

  const finishOnboarding = async (save) => {
    if (save && (interests.lookingFor.length || interests.offering.length)) {
      setSavingInterests(true);
      try {
        localStorage.setItem('rentals_interests', JSON.stringify(interests));
      } catch {
        toast.error('We could not save your choices. You can set them later in your profile.');
      }
      setSavingInterests(false);
    }
    const u = newUser;
    setNewUser(null);
    finishSignIn(u);
  };

  useEffect(() => {
    if (isOpen) {
      try { googleLogout(); } catch { /* ignore */ }
      return;
    }
    // Forget anything typed once the dialog is closed, and always reopen on Sign in.
    setIsLogin(true);
    setError('');
    setFieldErrors({});
    setLocalPhone('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgot(false);
    setShowVerifyEmail(false);
    setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phoneNumber: '', role: 'USER' });
  }, [isOpen]);

  if (!isOpen) return null;

  if (showForgot) {
    return (
      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => {
          setShowForgot(false);
          onClose();
        }}
        onBackToLogin={() => setShowForgot(false)}
      />
    );
  }

  if (showVerifyEmail) {
    return (
      <VerifyEmailModal
        isOpen={showVerifyEmail}
        onClose={() => {
          setShowVerifyEmail(false);
          onClose();
        }}
        email={registeredEmail}
        onSuccess={(token, user) => {
          completeSignIn(token, user);
          setShowVerifyEmail(false);
          setNewUser(user);
        }}
        onResend={async () => {
          const apiData = { ...formData };
      delete apiData.confirmPassword;
          await registerUserApi(apiData);
        }}
      />
    );
  }

  if (newUser) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl max-w-[480px] w-full p-6 sm:p-8 shadow-elevated max-h-[90vh] overflow-y-auto no-scrollbar animate-fade-up">
          <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight">What brings you here?</h2>
          <p className="text-base text-brand-text-secondary mt-2 mb-6">Personalise your Rentals Africa experience. You can select more than one.</p>
          <InterestsPicker value={interests} onChange={setInterests} />
          <button
            type="button"
            disabled={savingInterests}
            onClick={() => finishOnboarding(true)}
            className="w-full mt-8 py-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-base transition-all shadow-glow flex items-center justify-center active:scale-[0.98] disabled:opacity-60"
          >
            {savingInterests ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
          </button>
          <button type="button" disabled={savingInterests} onClick={() => finishOnboarding(false)} className="w-full mt-3 py-3 text-base font-semibold text-brand-text-secondary hover:text-brand-dark">
            Skip for now
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const handleLocalPhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1);
    setLocalPhone(val);
    handleChange({ target: { name: 'phoneNumber', value: `${dialCode}${val}` } });
  };

  const handleDialCodeChange = (e) => {
    const code = e.target.value;
    setDialCode(code);
    handleChange({ target: { name: 'phoneNumber', value: `${code}${localPhone}` } });
  };

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) e.email = 'Enter a valid email address';
    if (isLogin) {
      if (!formData.password) e.password = 'Enter your password';
    } else {
      if (formData.firstName.trim().length < 2) e.firstName = 'Enter your first name';
      if (formData.lastName.trim().length < 2) e.lastName = 'Enter your last name';
      if (localPhone.replace(/\D/g, '').length < 9) e.phoneNumber = 'Enter a valid phone number';
      if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
        e.password = 'Use at least 8 characters, with a letter and a number';
      }
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email.trim(), password: formData.password });
      } else {
        const apiData = { ...formData };
      delete apiData.confirmPassword;
        await registerUserApi({ ...apiData, email: formData.email.trim() });
        setRegisteredEmail(formData.email.trim());
        setShowVerifyEmail(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFieldErrors({});
    setFormData((f) => ({ ...f, password: '', confirmPassword: '' }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-[460px] w-full p-6 sm:p-8 shadow-elevated relative animate-fade-up max-h-[92vh] overflow-y-auto no-scrollbar">

        <button onClick={resetAndClose} aria-label="Close" className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors z-10">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-6 pr-8">
          <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight">
            {isLogin ? 'Welcome back.' : 'Create account.'}
          </h2>
          <p className="text-base text-brand-text-secondary mt-2">
            {isLogin ? 'Sign in to manage your trips and bookings.' : 'Join Rentals Africa to book stays, cars and VIP services.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-base font-medium">
            {error}
          </div>
        )}

        <div className="mb-4 flex justify-center">
          <GoogleLogin
            auto_select={false}
            use_fedcm_for_button={false}
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In failed.')}
            shape="pill"
            size="large"
            width={String(Math.max(240, Math.min(400, (typeof window !== 'undefined' ? window.innerWidth : 400) - 80)))}
            text="continue_with"
          />
        </div>

        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!isLogin && (
            <>
              <div>
                <label className={LABEL}>I want to</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  {[['USER', 'Book stays'], ['LANDLORD', 'Host listings']].map(([role, text]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, role }))}
                      className={`py-2.5 text-base font-bold rounded-lg transition-all ${
                        formData.role === role ? 'bg-white shadow-sm text-brand-dark border border-gray-200' : 'text-gray-500 hover:text-brand-dark'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" error={fieldErrors.firstName}>
                  <input type="text" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} className={`${INPUT} ${borderFor(fieldErrors.firstName)}`} />
                </Field>
                <Field label="Last Name" error={fieldErrors.lastName}>
                  <input type="text" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} className={`${INPUT} ${borderFor(fieldErrors.lastName)}`} />
                </Field>
              </div>

              <Field label="Phone Number" error={fieldErrors.phoneNumber}>
                <div className="flex">
                  <select value={dialCode} onChange={handleDialCodeChange} aria-label="Country code" className={`px-2 py-3.5 bg-gray-50 border rounded-l-xl border-r-0 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none text-base font-bold text-gray-700 cursor-pointer ${borderFor(fieldErrors.phoneNumber)}`}>
                    <option value="+234">+234</option>
                    <option value="+44">+44</option>
                    <option value="+1">+1</option>
                  </select>
                  <input type="tel" autoComplete="tel-national" value={localPhone} onChange={handleLocalPhoneChange} placeholder="803 000 0000" className={`${INPUT} !rounded-l-none ${borderFor(fieldErrors.phoneNumber)}`} aria-label="803 000 0000" />
                </div>
              </Field>
            </>
          )}

          <Field label="Email Address" error={fieldErrors.email}>
            <input type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" className={`${INPUT} ${borderFor(fieldErrors.email)}`} aria-label="name@example.com" />
          </Field>

          <Field
            label="Password"
            error={fieldErrors.password}
            right={isLogin && (
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm font-bold text-brand-primary hover:underline">
                Forgot password?
              </button>
            )}
          >
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={formData.password} onChange={handleChange} placeholder="Your password" className={`${INPUT} pr-12 ${borderFor(fieldErrors.password)}`} aria-label="Your password" />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isLogin && !fieldErrors.password && <p className="mt-1.5 text-sm text-brand-text-muted">At least 8 characters, with a letter and a number</p>}
          </Field>

          {!isLogin && (
            <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" className={`${INPUT} pr-12 ${borderFor(fieldErrors.confirmPassword)}`} aria-label="Repeat your password" />
                <button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </Field>
          )}

          <button type="submit" disabled={loading || googleLoading} className="w-full py-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-base transition-all shadow-glow flex items-center justify-center mt-2 active:scale-[0.98] disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-base font-medium text-gray-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={toggleMode} className="font-bold text-brand-dark hover:text-brand-primary transition-colors ml-1">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
