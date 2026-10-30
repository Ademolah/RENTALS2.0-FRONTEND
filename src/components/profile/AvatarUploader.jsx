import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatarApi } from '../../api/user';

const SIZE = 512;

function cropSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process image'))), 'image/jpeg', 0.9);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a valid image')); };
    img.src = url;
  });
}

export default function AvatarUploader({ src, initials, onUploaded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    setBusy(true);
    setError('');
    try {
      const blob = await cropSquare(file);
      const res = await uploadAvatarApi(blob);
      const user = res?.data?.user || res?.user || res?.data || {};
      onUploaded?.(user.profilePicture || user.avatarUrl || URL.createObjectURL(blob));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative w-32 h-32 rounded-full overflow-hidden bg-brand-dark text-white flex items-center justify-center text-4xl font-display font-bold ring-4 ring-white shadow-card group"
        aria-label="Change profile photo"
      >
        {src ? <img src={src} alt="Your profile" className="w-full h-full object-cover" /> : initials}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {busy ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7" />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <p className="text-sm text-brand-text-secondary">Photos are cropped to a centred square.</p>
      {error && <p className="text-sm text-status-booked font-medium" role="alert">{error}</p>}
    </div>
  );
}
