import { MapPin } from 'lucide-react';

const CITIES = ['Lagos', 'Abuja'];

export default function CitySwitcher({ activeCity, onChange }) {
  return (
    <div className="flex items-center space-x-2 mb-6">
      <MapPin className="w-4 h-4 text-gray-500" />
      <div className="inline-flex bg-gray-100 p-1 rounded-full border border-gray-200">
        {CITIES.map((city) => (
          <button
            key={city}
            onClick={() => onChange(city)}
            aria-pressed={activeCity === city}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeCity === city ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
