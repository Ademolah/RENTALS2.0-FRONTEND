import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Lock, Camera, Trash2,
  AlertCircle, Loader2, CheckCircle, CheckCircle2, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfileApi, updateMyProfileApi, deleteMyAccountApi,
  updateMyProfilePictureApi, removeMyProfilePictureApi
} from '../api/user';
import { forgotPasswordApi } from '../api/auth';

function FieldMessage({ error, success }) {
  if (!error && !success) return null;
  return (
    <p className={`mt-3 text-xs font-bold flex items-center ${error ? 'text-red-600' : 'text-green-600'}`}>
      {error ? <AlertCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
      {error || success}
    </p>
  );
}

export default function ProfileSettings() {
  const { user, logout, refreshUser, syncUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getMyProfileApi().then(res => {
      const u = res?.data?.user;
      if (u) {
        setProfileForm({ firstName: u.firstName || '', lastName: u.lastName || '', phoneNumber: u.phoneNumber || '' });
      }
    }).catch(() => {});
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsUpdatingProfile(true);
    try {
      const res = await updateMyProfileApi(profileForm);
      const freshUser = res?.data?.user || res?.user;
      if (!syncUser(freshUser)) await refreshUser();
      setProfileSuccess('Profile updated successfully.');
    } catch {
      setProfileError('Could not update your profile right now. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setIsUploadingAvatar(true);
    try {
      const res = await updateMyProfilePictureApi(file);
      const freshUser = res?.data?.user || res?.user;
      if (!syncUser(freshUser)) await refreshUser();
      setAvatarSuccess('Profile picture updated.');
      // Now that user.profilePicture is confirmed in sync, drop the local blob preview
      // so this and the Navbar avatar both render from the same real source.
      URL.revokeObjectURL(localPreview);
      setAvatarPreview(null);
    } catch (err) {
      console.error('[ProfileSettings] Picture upload failed:', err?.response?.status, err?.response?.data, err?.message);
      setAvatarError('Could not upload your picture right now. Please try again.');
      URL.revokeObjectURL(localPreview);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError('');
    setAvatarSuccess('');
    setIsUploadingAvatar(true);
    try {
      const res = await removeMyProfilePictureApi();
      const freshUser = res?.data?.user || res?.user;
      if (!syncUser(freshUser)) await refreshUser();
      setAvatarPreview(null);
      setAvatarSuccess('Profile picture removed.');
    } catch {
      setAvatarError('Could not remove your picture right now. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSendResetLink = async () => {
    setResetError('');
    setIsSendingReset(true);
    try {
      await forgotPasswordApi(user.email);
      setResetSent(true);
    } catch {
      setResetError('Could not send the reset link right now. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      await deleteMyAccountApi();
      logout();
      navigate('/');
    } catch {
      setDeleteError('Failed to delete account. Please ensure all active bookings are closed.');
      setIsDeletingAccount(false);
    }
  };

  const avatarSrc = avatarPreview || user?.profilePicture;
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

  return (
    <div className="max-w-2xl animate-in fade-in duration-300 space-y-6">

      {/* Profile Picture */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold uppercase">
                {initials}
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center disabled:opacity-60"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" /> {avatarSrc ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all flex items-center disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" /> Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">JPG or PNG, up to 5MB.</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
          </div>
        </div>
        <FieldMessage error={avatarError} success={avatarSuccess} />
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Profile Settings</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={profileForm.phoneNumber} onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={user?.email || ''} disabled className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed" />
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-1.5">Contact support to change the email on your account.</p>
          </div>
          <button type="submit" disabled={isUpdatingProfile} className="mt-4 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70">
            {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Changes'}
          </button>
          <FieldMessage error={profileError} success={profileSuccess} />
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Password</h2>
        {resetSent ? (
          <div className="flex items-start gap-3 bg-green-50 border border-green-100 text-green-800 rounded-xl p-4 mt-4">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">
              Check your inbox at <span className="font-bold">{user?.email}</span> for a secure link to reset your password.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 font-medium mb-5">
              To change your password, we'll email you a secure reset link.
            </p>
            <button
              type="button"
              onClick={handleSendResetLink}
              disabled={isSendingReset}
              className="flex items-center justify-center px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-70"
            >
              {isSendingReset ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Send Reset Link
            </button>
            <FieldMessage error={resetError} />
          </>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 rounded-3xl border border-red-100 p-8 shadow-sm">
        <h2 className="text-lg font-black text-red-900 mb-2 flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Danger Zone</h2>
        <p className="text-sm font-medium text-red-700/80 mb-6">Permanently delete your account and all associated data. This action is irreversible.</p>
        <button onClick={() => setIsDeleteModalOpen(true)} className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-red-600/20 flex items-center">
          <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
        </button>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
              This action is permanent and cannot be undone. All your personal data, saved favorites, and history will be wiped.
            </p>
            {deleteError && <FieldMessage error={deleteError} />}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="flex-1 py-4 font-bold text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center">
                {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
