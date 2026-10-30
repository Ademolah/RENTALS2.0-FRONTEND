import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toggleFavoriteApi } from '../../api/user';

export default function FavoriteHeart({ id, onMessage, className = '' }) {
  const { user, setShowAuthModal } = useAuth();
  const [saved, setSaved] = useState(user?.favoriteProperties?.includes(id) || false);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      onMessage?.('Sign in to save this listing.');
      setShowAuthModal?.(true);
      return;
    }
    if (user.role !== 'USER') {
      onMessage?.('Only guest accounts can save listings.');
      return;
    }
    const prev = saved;
    setSaved(!prev);
    try {
      await toggleFavoriteApi(id);
    } catch {
      setSaved(prev);
      onMessage?.('Could not update saved listings. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? 'Remove from saved' : 'Save listing'}
      aria-pressed={saved}
      className={`hover:scale-110 active:scale-95 transition-transform z-10 ${className}`}
    >
      <Heart
        className={`w-7 h-7 drop-shadow transition-colors duration-200 ${
          saved ? 'fill-brand-primary stroke-brand-primary' : 'fill-black/30 stroke-white stroke-[1.5]'
        }`}
      />
    </button>
  );
}
