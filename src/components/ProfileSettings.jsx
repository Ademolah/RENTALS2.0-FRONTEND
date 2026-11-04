import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Lock, Eye, EyeOff, Camera, Trash2,
  AlertCircle, Loader2, CheckCircle, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfileApi, updateMyProfileApi, deleteMyAccountApi,
  updateMyProfilePictureApi, removeMyProfilePictureApi, changeMyPasswordApi
} from '../api/user';

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
  const { user, logout, refreshUser } = useAuth();
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

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
      await updateMyProfileApi(profileForm);
      await refreshUser();
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
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 8MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setIsUploadingAvatar(true);
    try {
      await updateMyProfilePictureApi(file);
      await refreshUser();
      setAvatarSuccess('Profile picture updated.');
    } catch (err) {
      console.error('[ProfileSettings] Picture upload failed:', err?.response?.status, err?.response?.data, err?.message);
      setAvatarError('Could not upload your picture right now. Please try again.');
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
      await removeMyProfilePictureApi();
      await refreshUser();
      setAvatarPreview(null);
      setAvatarSuccess('Profile picture removed.');
    } catch {
      setAvatarError('Could not remove your picture right now. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeMyPasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('[ProfileSettings] Password change failed:', err?.response?.status, err?.response?.data, err?.message);
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        setPasswordError('Your current password is incorrect.');
      } else {
        setPasswordError('Could not update your password right now. Please try again later.');
      }
    } finally {
      setIsChangingPassword(false);
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
  const passwordInputType = showPasswords ? 'text' : 'password';

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
            <p className="text-[11px] text-gray-400 font-medium">JPG or PNG, up to 8MB.</p>
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

      {/* Change Password */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">Change Password</h2>
          <button
            type="button"
            onClick={() => setShowPasswords(s => !s)}
            className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center transition-colors"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
            {showPasswords ? 'Hide' : 'Show'}
          </button>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={passwordInputType} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={passwordInputType} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={passwordInputType} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={isChangingPassword} className="mt-4 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70">
            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Update Password'}
          </button>
          <FieldMessage error={passwordError} success={passwordSuccess} />
        </form>
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
