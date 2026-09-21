import React, { useState, useEffect } from 'react';
import { 
  Home, CarFront, Hotel, Crown, ShieldCheck, 
  MapPin, Calendar, Clock, Loader2, CheckCircle, 
  ChevronRight, Wallet, LayoutGrid
} from 'lucide-react';
import { getMyPropertyBookings } from '../api/reservation';
import { confirmPropertyCheckIn } from '../api/properties';
import { confirmCarHandover } from '../api/car';
import { getMyCarBookings } from '../api/car';

// --- SUB-COMPONENT: The Unified Booking Card ---
const BookingCard = ({ booking, onConfirmEscrow }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  // 1. Normalize Data based on Type
  const isCar = booking.type === 'CAR';
  const title = isCar 
    ? `${booking.carId?.make} ${booking.carId?.carModel} ${booking.carId?.year}`
    : booking.propertyId?.title || 'Luxury Shortlet';
  
  const image = isCar 
    ? booking.carId?.images?.[0] 
    : booking.propertyId?.images?.[0];

  const location = isCar 
    ? `${booking.carId?.location?.city}, ${booking.carId?.location?.state}`
    : booking.propertyId?.address?.city || 'Location unavailable';

  const startDate = new Date(isCar ? booking.pickupTime : booking.checkInDate);
  const endDate = new Date(isCar ? booking.dropoffTime : booking.checkOutDate);

  // 2. Escrow State Logic
  const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
  const escrowStatus = isCar ? booking.escrowStatus : booking.payoutStatus;
  const isReleased = isCar ? escrowStatus === 'RELEASED' : escrowStatus === 'RELEASED_TO_LANDLORD';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      if (isCar) {
        await confirmCarHandover(booking._id);
      } else {
        await confirmPropertyCheckIn(booking._id);
      }
      onConfirmEscrow(booking._id, booking.type);
    } catch (error) {
      console.error("Escrow confirmation failed:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row group">
      {/* Image Section */}
      <div className="relative h-56 md:h-auto md:w-72 bg-gray-100 overflow-hidden shrink-0">
        <img 
          src={image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md text-xs font-extrabold uppercase tracking-widest rounded-full text-gray-900 shadow-sm">
          {isCar ? 'Vehicle Rental' : 'Shortlet'}
        </div>
        {booking.reservationStatus === 'ACTIVE' && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            <span>Active</span>
          </div>
        )}
      </div>

      {/* Details & Escrow Section */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{title}</h3>
            <span className="text-lg font-bold text-gray-900">₦{booking.totalAmount.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center text-gray-500 text-sm font-medium space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            {isCar && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} Dropoff</span>
              </div>
            )}
          </div>
        </div>

        {/* ESCROW TRUST CENTER (Only show for ACTIVE bookings) */}
        {booking.reservationStatus === 'ACTIVE' && (
          <div className="mt-4 pt-6 border-t border-gray-100">
            {hasGuestConfirmed || isReleased ? (
              <div className="flex items-center space-x-3 bg-green-50/50 text-green-700 px-5 py-4 rounded-2xl border border-green-100">
                <div className="bg-green-500 rounded-full p-1 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold">Checked-in & Secured</div>
                  <div className="text-xs font-medium text-green-600 mt-0.5">Funds released to host. Enjoy your {isCar ? 'ride' : 'stay'}.</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-gray-900 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-gray-900">Escrow Protected</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Host is unpaid until you confirm arrival.</div>
                  </div>
                </div>
                
                <button 
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70 active:scale-95 duration-200"
                >
                  {isConfirming ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    `Confirm ${isCar ? 'Vehicle Pickup' : 'Check-In'}`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// --- MAIN DASHBOARD COMPONENT ---
export default function GuestDashboard() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const TABS = [
    { id: 'ALL', label: 'All Trips', icon: LayoutGrid },
    { id: 'SHORTLET', label: 'Shortlets', icon: Home },
    { id: 'CAR', label: 'Car Rentals', icon: CarFront },
    { id: 'HOTEL', label: 'Hotels (Soon)', icon: Hotel, disabled: true },
    { id: 'VIP', label: 'VIP (Soon)', icon: Crown, disabled: true },
  ];

  useEffect(() => {
    const fetchAllBookings = async () => {
      setLoading(true);
      try {
        // Parallel fetching for high performance
        const [propertyRes, carRes] = await Promise.allSettled([
          getMyPropertyBookings(),
          getMyCarBookings()
        ]);

        let unifiedBookings = [];

        // Normalize Property Data
        if (propertyRes.status === 'fulfilled' && propertyRes.value.data?.bookings) {
          const props = propertyRes.value.data.bookings.map(b => ({ ...b, type: 'SHORTLET' }));
          unifiedBookings = [...unifiedBookings, ...props];
        }

        // Normalize Car Data
        if (carRes.status === 'fulfilled' && carRes.value.data?.bookings) {
          const cars = carRes.value.data.bookings.map(b => ({ ...b, type: 'CAR' }));
          unifiedBookings = [...unifiedBookings, ...cars];
        }

        // Sort by most recent
        unifiedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(unifiedBookings);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, []);

  const handleEscrowSuccess = (reservationId, type) => {
    // Optimistically update the UI to show the green checkmark
    setBookings(prev => prev.map(booking => {
      if (booking._id === reservationId) {
        if (type === 'CAR') return { ...booking, guestConfirmedPickup: true, escrowStatus: 'RELEASED' };
        return { ...booking, checkInConfirmedByGuest: true, payoutStatus: 'RELEASED_TO_LANDLORD' };
      }
      return booking;
    }));

    setToastMessage(`${type === 'CAR' ? 'Vehicle pickup' : 'Check-in'} confirmed successfully!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const filteredBookings = bookings.filter(b => activeTab === 'ALL' || b.type === activeTab);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Your Itinerary</h1>
            <p className="text-gray-500 font-medium mt-3 text-lg">Manage your luxury bookings and reservations.</p>
          </div>
          <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 flex items-center space-x-4">
            <Wallet className="w-8 h-8 text-brand-primary" />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Escrow Value</div>
              <div className="text-xl font-bold text-gray-900">
                ₦{bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 flex flex-col lg:flex-row gap-10">
        
        {/* Desktop Sidebar / Mobile Top Scroll */}
        <div className="lg:w-64 shrink-0 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
          <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 sticky top-28">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  disabled={tab.disabled}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all text-left
                    ${isActive ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}
                    ${tab.disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : ''}`} />
                  <span className="whitespace-nowrap flex-1">{tab.label}</span>
                  {!tab.disabled && isActive && <ChevronRight className="w-4 h-4 hidden lg:block opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
              <p className="font-medium text-lg">Loading your itinerary...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 font-medium">You don't have any {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} reservations yet.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard 
                key={booking._id} 
                booking={booking} 
                onConfirmEscrow={handleEscrowSuccess} 
              />
            ))
          )}
        </div>
      </div>

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center space-x-3 border border-gray-700">
            <div className="bg-green-500 p-1 rounded-full">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}