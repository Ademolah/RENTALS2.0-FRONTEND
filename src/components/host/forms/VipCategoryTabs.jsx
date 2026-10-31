import { Building, ShieldCheck } from 'lucide-react';

const TABS = [
  { value: 'VENUE', label: 'VIP Venue', icon: Building },
  { value: 'SERVICE', label: 'VIP Service', icon: ShieldCheck },
];

// Switch between listing a VIP venue and a VIP service.
export default function VipCategoryTabs({ value, onChange }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex space-x-1 shadow-inner border border-gray-200 w-full md:w-auto">
        {TABS.map(({ value: tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`flex-1 md:flex-none flex justify-center items-center space-x-2 px-6 py-3 rounded-xl text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 ${
              value === tab ? 'bg-black text-amber-400 shadow-md' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
