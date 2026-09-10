import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  MapPin, 
  ShieldCheck,
  TrendingUp,
  Wallet
} from 'lucide-react';
import AddPropertyModal from '../components/AddPropertyModal';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for the mock reservations
  const [reservations, setReservations] = useState([
    {
      id: 'RES-8921',
      guestName: 'Chidi Okonkwo',
      guestAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      propertyTitle: 'Minimalist Luxury Suite',
      location: 'Ikoyi, Lagos',
      checkInDate: 'Sep 10, 2026',
      checkOutDate: 'Sep 14, 2026',
      totalAmount: 1050000,
      status: 'ARRIVING_TODAY', // Options: ARRIVING_TODAY, CHECKED_IN, COMPLETED
      escrowStatus: 'SECURED'
    },
    {
      id: 'RES-4410',
      guestName: 'Amina Bello',
      guestAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      propertyTitle: 'Waterfront Penthouse',
      location: 'Victoria Island, Lagos',
      checkInDate: 'Sep 12, 2026',
      checkOutDate: 'Sep 15, 2026',
      totalAmount: 850000,
      status: 'UPCOMING',
      escrowStatus: 'SECURED'
    }
  ]);

  // Handler to trigger the critical Escrow Check-In confirmation
  const handleConfirmCheckIn = (id) => {
    setReservations(prev => prev.map(res => 
      res.id === id ? { ...res, status: 'CHECKED_IN' } : res
    ));
    // Note: Later, this will trigger the Paystack Escrow Release API call.
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* 
        HERO SECTION 
        Clean, high-contrast typography with the sleek listing button.
      */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight leading-tight">
                Welcome back, {user?.firstName || 'Host'}.
              </h1>
              <p className="text-lg text-gray-500 mt-2 font-medium">
                You have <span className="text-gray-900 font-semibold">1 guest arriving today</span>. Let's prepare for their stay.
              </p>
            </div>

            {/* SLEEK, SHINING LIST PROPERTY BUTTON */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative overflow-hidden rounded-full bg-gray-900 px-6 py-3.5 transition-all duration-300 hover:bg-black hover:shadow-xl hover:scale-[1.02] shrink-0 active:scale-95"
            >
              {/* Shimmer effect overlay */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <div className="relative flex items-center justify-center space-x-2 text-white">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm tracking-wide">List a New Property</span>
              </div>
            </button>
            
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* 
          OVERVIEW METRICS 
          No blobs. Just crisp borders, subtle background hues, and mature typography. 
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          <div className="border border-gray-200 rounded-2xl p-6 transition-colors hover:border-gray-300">
            <div className="flex items-center space-x-2 text-gray-500 mb-4">
              <Wallet className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Escrow Balance</h3>
            </div>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight">₦1,900,000</div>
            <div className="mt-2 flex items-center text-sm font-medium text-emerald-600">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Fully secured by Paystack
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-6 transition-colors hover:border-gray-300">
            <div className="flex items-center space-x-2 text-gray-500 mb-4">
              <TrendingUp className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Expected Payouts</h3>
            </div>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight">₦850,000</div>
            <div className="mt-2 text-sm font-medium text-gray-500">
              Clearing within 48 hours
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-6 transition-colors hover:border-gray-300 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Occupancy Rate</h3>
              <span className="bg-white border border-gray-200 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-full">SEPT 2026</span>
            </div>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight">84%</div>
            <div className="mt-2 text-sm font-medium text-gray-500">
              +12% higher than last month
            </div>
          </div>

        </div>

        {/* 
          RESERVATIONS FEED 
          Action-driven list, replacing the boring SaaS table.
        */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Your Reservations</h2>
          <button className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors">
            View all
          </button>
        </div>

        <div className="space-y-4">
          {reservations.map((res) => (
            <div 
              key={res.id} 
              className="group border border-gray-200 rounded-2xl p-5 md:p-6 hover:shadow-lg transition-all duration-300 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              
              {/* Guest & Property Info */}
              <div className="flex items-start space-x-4 flex-1">
                <img 
                  src={res.guestAvatar} 
                  alt={res.guestName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{res.guestName}</h3>
                  <div className="text-sm text-gray-500 font-medium mt-0.5">{res.propertyTitle}</div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{res.location}</span>
                  </div>
                </div>
              </div>

              {/* Dates & Payout Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-12 flex-1 lg:justify-center border-t border-b border-gray-100 lg:border-none py-4 lg:py-0">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Stay Dates</div>
                  <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {res.checkInDate} <span className="text-gray-300 mx-1">→</span> {res.checkOutDate}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Payout</div>
                  <div className="text-sm font-semibold text-gray-900">
                    ₦{res.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center lg:justify-end gap-4 min-w-[200px]">
                
                {res.status === 'ARRIVING_TODAY' && (
                  <div className="w-full">
                    <div className="flex items-center space-x-1.5 text-amber-600 mb-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Arriving Today</span>
                    </div>
                    {/* CRITICAL ACTION BUTTON: Triggers Paystack Escrow Release later */}
                    <button 
                      onClick={() => handleConfirmCheckIn(res.id)}
                      className="w-full bg-gray-900 hover:bg-brand-primary text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Confirm Check-in</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {res.status === 'CHECKED_IN' && (
                  <div className="w-full flex items-center justify-end space-x-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">Check-in Confirmed. Payout Processing.</span>
                  </div>
                )}

                {res.status === 'UPCOMING' && (
                  <div className="w-full flex justify-end">
                    <span className="bg-gray-100 text-gray-600 font-semibold px-4 py-2 rounded-xl text-sm">
                      Upcoming Arrival
                    </span>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>

      </div>

      <AddPropertyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPropertyAdded={(newProp) => {
          console.log("New property added successfully:", newProp);
          // Optional: update local list state or refetch properties
        }}
      />
    </div>
  );

}