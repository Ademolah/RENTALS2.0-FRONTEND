import { Wifi, Droplets, Utensils, Dumbbell, Wine, Leaf, Car, Coffee, Bed, CheckCircle2 } from 'lucide-react';

// Picks an icon for an amenity name (matches the amenity presets on the host form).
export const getAmenityIcon = (amenity) => {
  if (!amenity) return CheckCircle2;
  const name = amenity.toLowerCase();

  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('pool') || name.includes('swim')) return Droplets;
  if (name.includes('restaurant') || name.includes('dining') || name.includes('food')) return Utensils;
  if (name.includes('fitness') || name.includes('gym')) return Dumbbell;
  if (name.includes('bar') || name.includes('lounge')) return Wine;
  if (name.includes('spa') || name.includes('wellness')) return Leaf;
  if (name.includes('valet') || name.includes('park')) return Car;
  if (name.includes('room service')) return Coffee;
  if (name.includes('bed') || name.includes('room') || name.includes('suite')) return Bed;

  return CheckCircle2;
};

export const countNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 1;
  const diffTime = Math.abs(new Date(checkOutDate) - new Date(checkInDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};
