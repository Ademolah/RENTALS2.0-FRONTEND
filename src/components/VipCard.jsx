import { MapPin, Clock, ChevronRight, Gem, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VipCard({ establishment }) {
  const {
    _id,
    title,
    establishmentType,
    address,
    images,
    openHours,
    services,
    pricePerNight // Using pricePerNight as the deposit fallback based on the backend schema workaround
  } = establishment;

  const mainImage = images?.[0] || 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=800&q=80';
  const formattedType = establishmentType?.replace('_', ' ') || 'VIP VENUE';
  const deposit = pricePerNight || 0;

  return (
    <Link 
      to={`/vip/${_id}`}
      className="group block relative w-full rounded-3xl overflow-hidden bg-black aspect-[3/4] md:aspect-square lg:aspect-[4/5] shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer"
    >
      {/* Background Image & Overlay */}
      <img 
        src={mainImage} 
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/95 transition-opacity duration-500"></div>

      {/* Top Badges */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-amber-400 uppercase tracking-widest border border-amber-400/20 flex items-center space-x-1.5 shadow-lg">
          <Gem className="w-3 h-3" />
          <span>{formattedType}</span>
        </div>
        
        {/* Days Open Indicator */}
        <div className="flex flex-col items-end gap-1">
          {openHours?.daysOpen?.slice(0, 3).map(day => (
            <span key={day} className="bg-white/10 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-sm border border-white/5">
              {day.substring(0, 3)}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Area (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 z-10 flex flex-col justify-end">
        
        {/* Title & Location */}
        <div className="mb-4">
          <h3 className="font-extrabold text-2xl md:text-3xl tracking-tight text-white drop-shadow-md mb-2">
            {title}
          </h3>
          <div className="flex flex-col space-y-1.5 text-xs font-medium text-gray-300">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> 
              {address?.street}, {address?.city}
            </span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> 
              {openHours?.open} - {openHours?.close}
            </span>
          </div>
        </div>

        {/* Services Scrolling Row */}
        {services && services.length > 0 && (
          <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-white/10">
            {services.map((service, idx) => (
              <div 
                key={idx}
                className="snap-start shrink-0 bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap"
              >
                {service}
              </div>
            ))}
          </div>
        )}

        {/* Glassmorphism Deposit Footer */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-lg border border-white/20 p-4 rounded-2xl">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-amber-400/80 mb-0.5">
              Required Deposit
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="font-extrabold text-white text-lg md:text-xl tracking-tight">
                ₦{deposit.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center group-hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <ChevronRight className="w-5 h-5 font-bold" />
          </div>
        </div>

      </div>
    </Link>
  );
}