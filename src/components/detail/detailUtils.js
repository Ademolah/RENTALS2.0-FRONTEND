import { useRef } from 'react';

export const timeText = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// Accepts {lat,lng}, {latitude,longitude} or GeoJSON [lng, lat].
export function coordsOf(c) {
  if (!c) return {};
  if (Array.isArray(c) && c.length === 2 && c.every((n) => Number.isFinite(Number(n)))) return { lat: Number(c[1]), lng: Number(c[0]) };
  const lat = Number(c.lat ?? c.latitude);
  const lng = Number(c.lng ?? c.lon ?? c.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {};
}

export function directionsUrl({ lat, lng, address }) {
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && !Number.isNaN(Number(lat))) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
}

// The signed-in host viewing their own listing sees a manage card instead of the booking panel.
export function isOwnListing(user, ownerId) {
  if (!user || !ownerId) return false;
  const uid = String(user._id || user.id || '');
  return !!uid && uid === String(ownerId);
}

// Touch swipe for the lightbox: onSwipe(-1) = next, onSwipe(1) = previous.
export function useSwipe(onSwipe) {
  const start = useRef(null);
  return {
    onTouchStart: (e) => { start.current = e.touches[0].clientX; },
    onTouchEnd: (e) => {
      if (start.current === null) return;
      const dx = e.changedTouches[0].clientX - start.current;
      start.current = null;
      if (Math.abs(dx) > 50) onSwipe(dx < 0 ? -1 : 1);
    },
  };
}
