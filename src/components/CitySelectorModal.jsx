import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CitySelectorModal({
  onSelect,
  title = "Where to?",
  subtitle = "Select your destination to explore our curated portfolio.",
  buttonText = "Explore Portfolio"
}) {
  const [selectedState, setSelectedState] = useState('Lagos');

  const handleContinue = () => {
    if (selectedState) {
      onSelect(selectedState);
    }
  };

  const cities = [
    { id: 'Lagos', name: 'Lagos', description: 'The Commercial Capital', image: '/lagos.jpg' },
    { id: 'Abuja', name: 'Abuja', description: 'The Federal Capital', image: '/abuja.jpg' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-4 transition-all duration-500">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-[420px] sm:max-w-xl w-full relative shadow-elevated animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out">

        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-brand-dark tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-brand-text-secondary text-base px-4">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {cities.map((city) => {
            const isSelected = selectedState === city.id;
            return (
              <button
                key={city.id}
                onClick={() => setSelectedState(city.id)}
                className="group relative aspect-[4/5] sm:aspect-square overflow-hidden rounded-2xl text-left transition-all duration-300"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent"></div>

                <div className={`absolute inset-0 border-[3px] rounded-2xl transition-all duration-300 z-10 ${
                  isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-transparent group-hover:border-white/30'
                }`}></div>

                {isSelected && (
                  <div className="absolute top-3 right-3 z-20 bg-brand-primary text-white rounded-full shadow-lg animate-in zoom-in duration-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <h3 className="text-white text-xl sm:text-2xl font-display font-bold drop-shadow-md">
                    {city.name}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm font-medium drop-shadow-md truncate">
                    {city.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedState}
          className="w-full flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-hover text-white px-6 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 group"
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
