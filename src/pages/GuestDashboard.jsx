import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, CarFront, Hotel, Crown, ShieldCheck, 
  MapPin, Calendar, Clock, Loader2, CheckCircle, 
  ChevronRight, Wallet, LayoutGrid, AlertCircle, Heart, Star, Sparkles
} from 'lucide-react';

import { getMyPropertyBookings } from '../api/reservation';
import { confirmPropertyCheckIn } from '../api/properties';
import { getMyCarBookings, confirmCarHandover } from '../api/car';
import { getMyHotelBookings, confirmHotelGuestCheckIn } from '../api/hotel';
import { executePayout } from '../api/payouts';

import { getMyFavoritesApi, toggleFavoriteApi } from '../api/user';

// --- SUB-COMPONENT: The Unified Booking Card ---
const BookingCard = ({ booking, onConfirmEscrow }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [localToast, setLocalToast] = useState({ visible: false, message: '', type: 'success' });

  const showLocalToast = (message, type = 'success') => {
    setLocalToast({ visible: true, message, type });
    setTimeout(() => setLocalToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const isCar = booking.type === 'CAR';
  const isHotel = booking.type === 'HOTEL';
  const isVip = booking.type === 'VIP'; 

  const title = isCar 
    ? `${booking.carId?.make} ${booking.carId?.carModel} ${booking.carId?.year}`
    : booking.propertyId?.title || (isHotel ? 'Luxury Hotel' : isVip ? 'Exclusive Venue' : 'Luxury Shortlet');
  
  const image = isCar 
    ? booking.carId?.images?.[0] 
    : booking.propertyId?.images?.[0];

  const hasHostConfirmed = isCar 
    ? booking.ownerConfirmedHandover 
    : (booking.checkInConfirmedByHost || booking.checkInConfirmedByLandlord);

  const location = isCar 
    ? `${booking.carId?.location?.city || ''}, ${booking.carId?.location?.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
    : booking.propertyId?.address?.city || 'Location unavailable';

  const startDate = new Date(isCar ? booking.pickupTime : booking.checkInDate);
  const endDate = new Date(isCar ? booking.dropoffTime : booking.checkOutDate);

  const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
  const escrowStatus = isCar ? booking.escrowStatus : booking.payoutStatus;
  const isReleased = isCar ? escrowStatus === 'RELEASED' : escrowStatus === 'RELEASED_TO_LANDLORD';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      if (isCar) {
        await confirmCarHandover(booking._id);
      } else if (isHotel) {
        await confirmHotelGuestCheckIn(booking._id);
      } else {
        // VIP and Shortlet share the unified property check-in logic
        await confirmPropertyCheckIn(booking._id);
      }

      let isPayoutReleased = false;
      if (hasHostConfirmed) {
        await executePayout(booking._id);
        isPayoutReleased = true;
      }

      onConfirmEscrow(booking._id, booking.type, isPayoutReleased);

      if (isPayoutReleased) {
        showLocalToast("Confirmation complete! Funds released to host.", "success");
      } else {
        showLocalToast("Confirmed! Waiting for host to confirm.", "success");
      }
    } catch (error) {
      console.error("Escrow confirmation failed:", error);
      showLocalToast(error?.response?.data?.message || "Confirmation failed. Please try again.", "error");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row group relative">
      
      {/* Decorative VIP Glow */}
      {isVip && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>}

      {/* Image Section */}
      <div className="relative h-56 md:h-auto md:w-72 bg-gray-100 overflow-hidden shrink-0">
        <img 
          src={image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Dynamic Badge Styling based on type */}
        <div className={`absolute top-4 left-4 px-3 py-1 backdrop-blur-md text-xs font-extrabold uppercase tracking-widest rounded-full shadow-sm flex items-center space-x-1.5
          ${isVip ? 'bg-amber-500/90 text-black' : 'bg-white/90 text-gray-900'}
        `}>
          {isVip && <Sparkles className="w-3 h-3" />}
          <span>{isVip ? 'VIP Concierge' : isCar ? 'Vehicle Rental' : isHotel ? 'Hotel Booking' : 'Shortlet'}</span>
        </div>

        {(booking.reservationStatus === 'ACTIVE' || booking.paymentStatus === 'SUCCESS') && !isReleased && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            <span>Secured</span>
          </div>
        )}
      </div>

      {/* Details & Escrow Section */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative z-10">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{title}</h3>
            <span className="text-lg font-black text-gray-900 tracking-tight">₦{(booking.totalAmount || 0).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center text-gray-500 text-sm font-medium space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                {!isVip && ` - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
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

        {/* Action Panel */}
        <div className="mt-4 pt-6 border-t border-gray-100">
          {isReleased ? (
            <div className={`flex items-center space-x-3 px-5 py-4 rounded-2xl border ${isVip ? 'bg-amber-50/50 text-amber-900 border-amber-100' : 'bg-green-50/50 text-green-700 border-green-100'}`}>
              <div className={`rounded-full p-1 shadow-sm ${isVip ? 'bg-amber-500 text-black' : 'bg-green-500 text-white'}`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">
                  {isCar ? 'Pickup Confirmed & Active' : isVip ? 'Arrival Confirmed' : 'Checked-in & Secured'}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${isVip ? 'text-amber-700' : 'text-green-600'}`}>
                  Funds released to venue. Enjoy your {isCar ? 'ride' : 'experience'}.
                </div>
              </div>
            </div>
          ) : hasGuestConfirmed && !hasHostConfirmed ? (
            <div className="flex items-center space-x-3 bg-gray-50/50 text-gray-700 px-5 py-4 rounded-2xl border border-gray-200">
              <div className="bg-gray-400 rounded-full p-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold">Waiting for {isCar ? 'Owner' : isVip ? 'Concierge' : 'Host'}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">
                  You've confirmed. Escrow will release once the venue acknowledges.
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${
              hasHostConfirmed 
                ? isVip ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/50 border-blue-200' 
                : 'bg-gray-50/50 border-gray-100'
            }`}>
              <div className="flex items-start space-x-3">
                <ShieldCheck className={`w-5 h-5 mt-0.5 ${hasHostConfirmed ? isVip ? 'text-amber-600' : 'text-blue-600' : 'text-gray-900'}`} />
                <div>
                  <div className={`text-sm font-bold ${hasHostConfirmed ? isVip ? 'text-amber-900' : 'text-blue-900' : 'text-gray-900'}`}>
                    {hasHostConfirmed ? `${isCar ? 'Owner' : isVip ? 'Concierge' : 'Host'} Confirmed ${isVip ? 'Arrival' : 'Handover'}` : 'Deposit Escrowed'}
                  </div>
                  <div className={`text-xs font-medium mt-0.5 ${hasHostConfirmed ? isVip ? 'text-amber-700' : 'text-blue-700' : 'text-gray-500'}`}>
                    {hasHostConfirmed 
                      ? 'Please tap confirm to release the deposit to the venue.' 
                      : `Venue is unpaid until you confirm your ${isCar ? 'pickup' : 'arrival'}.`}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center disabled:opacity-70 active:scale-95 duration-200 ${
                  hasHostConfirmed 
                    ? isVip ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-900 hover:bg-black text-white'
                }`}
              >
                {isConfirming ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                ) : (
                  `Confirm ${isCar ? 'Vehicle Pickup' : isVip ? 'Venue Arrival' : 'Check-In'}`
                )}
              </button>
            </div>
          )}
        </div>

        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 ease-out ${localToast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}>
          <div className={`px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border font-bold text-xs tracking-wide whitespace-nowrap ${
            localToast.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {localToast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{localToast.message}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- SUB-COMPONENT: Favorite Property Card ---
const FavoriteCard = ({ property, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleHeartClick = async (e) => {
    e.preventDefault(); 
    setIsRemoving(true);
    try {
      await toggleFavoriteApi(property._id || property.id);
      onRemove(property._id || property.id);
    } catch (error) {
      console.error("Failed to remove favorite", error);
      setIsRemoving(false); 
    }
  };

  const isAvailable = property.isAvailable ?? true;
  const nextDate = property.nextAvailableDate 
    ? new Date(property.nextAvailableDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown';

  return (
    <Link to={`/property/${property._id || property.id}`} className="group cursor-pointer flex flex-col gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
        <img 
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'} 
          alt={property.title} 
          className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 ${isRemoving ? 'opacity-50 blur-sm' : ''}`}
        />
        
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <div className="bg-green-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
              Available
            </div>
          ) : (
            <div className="bg-gray-900/90 backdrop-blur-sm text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
              Booked until {nextDate}
            </div>
          )}
        </div>

        <button 
          onClick={handleHeartClick}
          disabled={isRemoving}
          className="absolute top-3 right-3 text-white hover:scale-110 transition-transform drop-shadow-md z-10 bg-black/20 p-1.5 rounded-full backdrop-blur-sm"
        >
          {isRemoving ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Heart className="w-5 h-5 fill-brand-primary stroke-brand-primary" />
          )}
        </button>
      </div>

      <div className="flex flex-col text-gray-900 px-1 pb-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-sm leading-tight truncate pr-4 text-gray-900">
            {property.address?.city || 'Location unavailable'}
          </h3>
          <div className="flex items-center space-x-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
            <span className="text-xs font-medium">5.0</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs truncate mt-0.5">{property.title}</p>
        <div className="mt-2 flex items-baseline space-x-1 border-t border-gray-50 pt-2">
          <span className="font-extrabold text-sm">₦{(property.pricePerNight || 0).toLocaleString()}</span>
          <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">/ night</span>
        </div>
      </div>
    </Link>
  );
};


// --- MAIN DASHBOARD COMPONENT ---
export default function GuestDashboard() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // SURGICAL FIX: Un-disable the VIP tab
  const TABS = [
    { id: 'ALL', label: 'All Trips', icon: LayoutGrid },
    { id: 'SHORTLET', label: 'Shortlets', icon: Home },
    { id: 'CAR', label: 'Car Rentals', icon: CarFront },
    { id: 'HOTEL', label: 'Hotels', icon: Hotel },
    { id: 'VIP', label: 'VIP Venues', icon: Crown }, 
    { id: 'FAVORITES', label: 'Saved Stays', icon: Heart },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [propertyRes, carRes, hotelRes, favRes] = await Promise.allSettled([
          getMyPropertyBookings(),
          getMyCarBookings(),
          getMyHotelBookings(),
          getMyFavoritesApi() 
        ]);

        let unifiedBookings = [];

        if (propertyRes.status === 'fulfilled' && propertyRes.value.data?.bookings) {
          const reservations = propertyRes.value.data.bookings.map(b => {
            let trueType = 'SHORTLET';
            // SURGICAL FIX: Map VIP category safely from the unified reservation collection
            if (b.propertyId?.category === 'HOTEL' || b.type === 'HOTEL') {
              trueType = 'HOTEL';
            } else if (b.propertyId?.category === 'VIP RESERVATION' || b.propertyId?.category === 'VIP' || b.type === 'VIP') {
              trueType = 'VIP';
            } else if (b.carId || b.type === 'CAR') {
              trueType = 'CAR';
            }
            return { ...b, type: trueType };
          });
          unifiedBookings = [...unifiedBookings, ...reservations];
        }

        if (carRes.status === 'fulfilled' && carRes.value.data?.bookings) {
          const cars = carRes.value.data.bookings.map(b => ({ ...b, type: 'CAR' }));
          unifiedBookings = [...unifiedBookings, ...cars];
        }

        if (hotelRes.status === 'fulfilled' && hotelRes.value.data?.bookings) {
          const hotels = hotelRes.value.data.bookings.map(b => ({ ...b, type: 'HOTEL' }));
          unifiedBookings = [...unifiedBookings, ...hotels];
        }

        if (favRes.status === 'fulfilled') {
          const favs = favRes.value.data?.favorites || favRes.value.favorites || [];
          setFavorites(favs);
        }

        const uniqueBookings = Array.from(new Map(unifiedBookings.map(item => [item._id, item])).values());
        uniqueBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(uniqueBookings);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleEscrowSuccess = (reservationId, type, isPayoutReleased) => {
    setBookings(prev => prev.map(booking => {
      if (booking._id === reservationId) {
        const updated = { ...booking };
        if (type === 'CAR') {
          updated.guestConfirmedPickup = true; 
        } else {
          updated.checkInConfirmedByGuest = true;
        }
        if (isPayoutReleased) {
          if (type === 'CAR') {
            updated.escrowStatus = 'RELEASED';
          } else {
            updated.payoutStatus = 'RELEASED_TO_LANDLORD';
          }
        }
        return updated;
      }
      return booking;
    }));

    if (isPayoutReleased) {
      setToastMessage(`Confirmation complete! Funds released to ${type === 'CAR' ? 'owner' : type === 'VIP' ? 'venue' : 'host'}.`);
    } else {
      setToastMessage(`${type === 'CAR' ? 'Pickup' : type === 'VIP' ? 'Arrival' : 'Check-in'} confirmed! Waiting for ${type === 'CAR' ? 'owner' : 'host'}.`);
    }
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleRemoveFavorite = (propertyId) => {
    setFavorites(prev => prev.filter(p => (p._id || p.id) !== propertyId));
    setToastMessage("Property removed from Saved Stays.");
    setTimeout(() => setToastMessage(''), 2500);
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
        
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
          <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 sticky top-28">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isVipTab = tab.id === 'VIP';
              return (
                <button
                  key={tab.id}
                  disabled={tab.disabled}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all text-left
                    ${isActive ? isVipTab ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}
                    ${tab.disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive && !isVipTab ? 'text-brand-primary' : ''}`} />
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
              <p className="font-medium text-lg">Loading your dashboard...</p>
            </div>
          ) : activeTab === 'FAVORITES' ? (
            favorites.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No saved stays yet</h3>
                <p className="text-gray-500 font-medium">Properties you favorite will appear here for easy booking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {favorites.map((fav) => (
                  <FavoriteCard 
                    key={fav._id || fav.id} 
                    property={fav} 
                    onRemove={handleRemoveFavorite} 
                  />
                ))}
              </div>
            )
          ) : (
            filteredBookings.length === 0 ? (
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
            )
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