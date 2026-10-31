import { Wifi, Droplets, Utensils, Dumbbell, Wine, Sparkles, Car, Coffee } from 'lucide-react';

export const HOTEL_AMENITIES = [
  { name: 'Free Wifi', icon: Wifi },
  { name: 'Swimming Pool', icon: Droplets },
  { name: 'Restaurant', icon: Utensils },
  { name: 'Fitness Center', icon: Dumbbell },
  { name: 'Bar / Lounge', icon: Wine },
  { name: 'Spa & Wellness', icon: Sparkles },
  { name: 'Valet Parking', icon: Car },
  { name: 'Room Service', icon: Coffee },
];

export const PROPERTY_AMENITIES = [
  'High-Speed WiFi', 'Swimming Pool', 'Fitness Center', '24/7 Power',
  'Smart TV', 'Air Conditioning', 'Free Parking', 'Chef Service',
  'Ocean View', 'Top-Tier Security', 'Daily Cleaning', 'Workspace',
];

export const CAR_FEATURES = [
  'Leather Seats', 'Apple CarPlay', 'Android Auto', '360° Camera',
  'GPS Navigation', 'Premium Audio', 'Sunroof / Moonroof', 'Tinted Windows',
  'Chauffeur Included', 'Armored / Bulletproof', 'Wi-Fi Hotspot', 'Bluetooth',
];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DEFAULT_OPEN_DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
export const COMMON_VENUE_SERVICES = ['Bottle Service', 'Private Cabana', 'Valet Parking', 'VIP Host', 'Private Security', 'Shisha', 'Fine Dining'];
export const COMMON_LOGISTICS_SERVICES = ['Armed Guards', 'Armored Vehicle', 'Advance Route Planning', '24/7 Availability', 'Dedicated Driver', 'Bilingual Staff'];

export const LOCATION_DATA = {
  Lagos: [
    'Ikoyi', 'Banana Island', 'Victoria Island', 'Lekki Phase 1',
    'Lekki', 'Ajah', 'Ikeja', 'Magodo', 'Maryland', 'Gbagada',
    'Surulere', 'Yaba', 'Festac',
  ].sort(),
  Abuja: [
    'Asokoro', 'Maitama', 'Wuse 2', 'Wuse', 'Garki',
    'Central Business District', 'Jabi', 'Utako', 'Gwarinpa',
    'Apo', 'Kubwa', 'Lugbe',
  ].sort(),
};
