import { useState } from 'react';
import { ArrowRight, Building2, Landmark } from 'lucide-react';

export default function CitySelectorModal({ onSelect }) {
  const [selectedState, setSelectedState] = useState('');

  const handleContinue = () => {
    if (selectedState) {
      onSelect(selectedState);
    }
  };

  const cities = [
    {
      id: 'Lagos',
      name: 'Lagos',
      description: 'Commercial hub',
      icon: Building2
    },
    {
      id: 'Abuja',
      name: 'Abuja',
      description: 'Capital city',
      icon: Landmark
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/70 backdrop-blur-xl animate-in fade-in duration-500 p-4">
      
      {/* Max-width reduced to md (448px) and padding tightened */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-w-md w-full relative overflow-hidden transform transition-all">
        
        {/* Subtle Brand Accent Glow - Scaled down */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          
          {/* Minimalist Editorial Welcome */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-[1px] w-8 bg-brand-primary"></div>
            <span className="text-brand-primary text-[10px] font-extrabold uppercase tracking-[0.3em]">
              Your Journey Begins
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Where to?
          </h2>
          <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed">
            Select your destination to see curated spaces.
          </p>

          {/* Forced side-by-side grid on all screens */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
            {cities.map((city) => {
              const Icon = city.icon;
              const isSelected = selectedState === city.id;
              
              return (
                <button
                  key={city.id}
                  onClick={() => setSelectedState(city.id)}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    isSelected 
                      ? 'border-brand-primary bg-brand-primary/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]' 
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  {/* Active Indicator Dot */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--brand-primary),0.4)]"></div>
                  )}
                  
                  {/* Dynamic Icon Box - Scaled down */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${
                    isSelected 
                      ? 'bg-brand-primary text-white' 
                      : 'bg-gray-100 text-gray-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <h3 className={`text-base font-bold mb-0.5 transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {city.name}
                  </h3>
                  <p className="text-[10px] md:text-xs font-medium text-gray-500 leading-tight">
                    {city.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Primary Action Button - Height normalized */}
          <button 
            onClick={handleContinue}
            disabled={!selectedState}
            className="w-full flex items-center justify-center space-x-2 bg-brand-primary hover:opacity-90 text-white px-6 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-brand-primary/25"
          >
            <span>Explore Curated Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </div>
    </div>
  );
}