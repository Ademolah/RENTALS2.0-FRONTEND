import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home, CarFront, Hotel, Crown, ShieldCheck,
  MapPin, Calendar, Clock, Loader2, CheckCircle,
  ChevronRight, Wallet, LayoutGrid, AlertCircle, Heart, Star,
  Settings, User, Phone, Trash2, X, Bell
} from 'lucide-react';

import { getMyPropertyBookings, cancelBookingApi } from '../api/reservation';
import { confirmPropertyCheckIn } from '../api/properties';
import { getMyCarBookings, confirmCarHandover } from '../api/car';
import { getMyHotelBookings, confirmHotelGuestCheckIn } from '../api/hotel';
import { executePayout } from '../api/payouts';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../api/notifications';
import { apiClient } from '../api/client';

import { getMyFavoritesApi, toggleFavoriteApi, getMyProfileApi, updateMyProfileApi, deleteMyAccountApi } from '../api/user';
import HostUpgradeModal from '../components/HostUpgradeModal';
import { useAuth } from '../context/AuthContext';

// --- SUB-COMPONENT: The Unified Booking Card ---
const BookingCard = ({ booking, onConfirmEscrow, onCancelSuccess }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [localToast, setLocalToast] = useState({ visible: false, message: '', type: 'success' });

  const showLocalToast = (message, type = 'success') => {
    setLocalToast({ visible: true, message, type });
    setTimeout(() => setLocalToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const isCar = booking.type === 'CAR';
  const isHotel = booking.type === 'HOTEL';
  const isVip = booking.type === 'VIP'; 
  const isVipService = booking.type === 'VIP_SERVICE'; // 💡 NEW: Identify VIP Service
  const isVipAsset = isVip || isVipService;

  const title = isCar 
    ? `${booking.carId?.make} ${booking.carId?.carModel} ${booking.carId?.year}`
    : booking.propertyId?.title || (isHotel ? 'Luxury Hotel' : isVipService ? 'VIP Service' : isVip ? 'Exclusive Venue' : 'Luxury Shortlet');
  
  const image = isCar 
    ? booking.carId?.images?.[0] 
    : booking.propertyId?.images?.[0];

  const hasHostConfirmed = isCar 
    ? booking.ownerConfirmedHandover 
    : (booking.checkInConfirmedByHost || booking.checkInConfirmedByLandlord || booking.ownerConfirmedDelivery);

  const location = isCar 
    ? `${booking.carId?.location?.city || ''}, ${booking.carId?.location?.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
    : booking.propertyId?.address?.city || 'Location unavailable';

  const startDate = new Date(booking.startDate || booking.pickupTime || booking.checkInDate);
  const endDate = new Date(booking.endDate || booking.dropoffTime || booking.checkOutDate);

  const hasGuestConfirmed = isCar 
    ? booking.guestConfirmedPickup 
    : (booking.checkInConfirmedByGuest || booking.guestConfirmedDelivery);
    
  const escrowStatus = isCar ? booking.escrowStatus : booking.payoutStatus;
  const isReleased = isCar ? escrowStatus === 'RELEASED' : escrowStatus === 'RELEASED_TO_LANDLORD';
  
  const isCancelled = booking.reservationStatus === 'CANCELLED';
  const canCancel = !hasGuestConfirmed && !isReleased && !isCancelled && booking.reservationStatus !== 'COMPLETED';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      if (isCar) {
        await confirmCarHandover(booking._id);
      } else if (isHotel) {
        await confirmHotelGuestCheckIn(booking._id);
      } else {
        // 💡 Both VIP Venues and VIP Services utilize the base property confirmation engine
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

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelBookingApi(booking._id);
      onCancelSuccess(booking._id);
      showLocalToast("Booking cancelled successfully. Refund initiated.", "success");
      setIsCancelModalOpen(false);
    } catch (error) {
      console.error("Cancellation failed:", error);
      showLocalToast(error?.response?.data?.message || "Cancellation failed. Please try again.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all flex flex-col md:flex-row group relative ${isCancelled ? 'opacity-75 grayscale-[0.3]' : 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]'}`}>
      
      {isVipAsset && !isCancelled && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>}

      <div className="relative h-56 md:h-auto md:w-72 bg-gray-100 overflow-hidden shrink-0">
        <img 
          src={image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        <div className={`absolute top-4 left-4 px-3 py-1 backdrop-blur-md text-xs font-extrabold uppercase tracking-widest rounded-full shadow-sm flex items-center space-x-1.5
          ${isVipAsset ? 'bg-amber-500/90 text-black' : 'bg-white/90 text-gray-900'}
        `}>
          <span>{isVipService ? 'VIP Service' : isVip ? 'VIP Venue' : isCar ? 'Vehicle Rental' : isHotel ? 'Hotel Booking' : 'Shortlet'}</span>
        </div>

        {isCancelled ? (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            Cancelled
          </div>
        ) : (booking.reservationStatus === 'ACTIVE' || booking.paymentStatus === 'SUCCESS') && !isReleased && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            <span>Secured</span>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative z-10">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className={`text-xl md:text-2xl font-bold tracking-tight leading-tight ${isCancelled ? 'text-gray-500 line-through decoration-red-500/50' : 'text-gray-900'}`}>{title}</h3>
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
          </div>
        </div>

        {/* Action Panel */}
        <div className="mt-4 pt-6 border-t border-gray-100">
          {isCancelled ? (
            <div className="flex items-center space-x-3 bg-red-50/50 text-red-700 px-5 py-4 rounded-2xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>
                <div className="text-sm font-bold">Reservation Cancelled</div>
                <div className="text-xs font-medium mt-0.5 text-red-600">This booking has been cancelled and funds are flagged for a refund.</div>
              </div>
            </div>
          ) : isReleased ? (
            <div className={`flex items-center space-x-3 px-5 py-4 rounded-2xl border ${isVipAsset ? 'bg-amber-50/50 text-amber-900 border-amber-100' : 'bg-green-50/50 text-green-700 border-green-100'}`}>
              <div className={`rounded-full p-1 shadow-sm ${isVipAsset ? 'bg-amber-500 text-black' : 'bg-green-500 text-white'}`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">
                  {isCar ? 'Pickup Confirmed & Active' : isVipService ? 'Service Delivered' : isVip ? 'Arrival Confirmed' : 'Checked-in & Secured'}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${isVipAsset ? 'text-amber-700' : 'text-green-600'}`}>
                  Funds released to {isVipService ? 'provider' : 'venue'}. Enjoy your {isCar ? 'ride' : 'experience'}.
                </div>
              </div>
            </div>
          ) : hasGuestConfirmed && !hasHostConfirmed ? (
            <div className="flex items-center space-x-3 bg-gray-50/50 text-gray-700 px-5 py-4 rounded-2xl border border-gray-200">
              <div className="bg-gray-400 rounded-full p-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold">Waiting for {isCar ? 'Owner' : isVipAsset ? 'Concierge' : 'Host'}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">
                  You've confirmed. Escrow will release once the provider acknowledges.
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${
              hasHostConfirmed 
                ? isVipAsset ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/50 border-blue-200' 
                : 'bg-gray-50/50 border-gray-100'
            }`}>
              <div className="flex items-start space-x-3">
                <ShieldCheck className={`w-5 h-5 mt-0.5 ${hasHostConfirmed ? isVipAsset ? 'text-amber-600' : 'text-blue-600' : 'text-gray-900'}`} />
                <div>
                  <div className={`text-sm font-bold ${hasHostConfirmed ? isVipAsset ? 'text-amber-900' : 'text-blue-900' : 'text-gray-900'}`}>
                    {hasHostConfirmed ? `${isCar ? 'Owner' : isVipAsset ? 'Concierge' : 'Host'} Confirmed ${isVipService ? 'Delivery' : isVip ? 'Arrival' : 'Handover'}` : 'Deposit Escrowed'}
                  </div>
                  <div className={`text-xs font-medium mt-0.5 ${hasHostConfirmed ? isVipAsset ? 'text-amber-700' : 'text-blue-700' : 'text-gray-500'}`}>
                    {hasHostConfirmed 
                      ? `Please tap confirm to release the deposit to the ${isVipService ? 'provider' : 'venue'}.` 
                      : `Provider is unpaid until you confirm your ${isVipService ? 'delivery' : isCar ? 'pickup' : 'arrival'}.`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {canCancel && (
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center disabled:opacity-70 active:scale-95 duration-200 ${
                    hasHostConfirmed 
                      ? isVipAsset ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-900 hover:bg-black text-white'
                  }`}
                >
                  {isConfirming ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    `Confirm ${isCar ? 'Pickup' : isVipService ? 'Delivery' : isVip ? 'Arrival' : 'Check-In'}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 ease-out ${localToast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}>
          <div className={`px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border font-bold text-xs tracking-wide whitespace-nowrap ${
            localToast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {localToast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{localToast.message}</span>
          </div>
        </div>

        {/* CANCELLATION MODAL */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)}></div>
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
              <button onClick={() => setIsCancelModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Cancel Reservation?</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
                Are you sure you want to cancel your reservation for <span className="font-bold text-gray-900">{title}</span>? 
                This action cannot be undone. If you cancel, your escrowed funds will be flagged for administrative review and refund processing.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCancelModalOpen(false)} 
                  className="flex-1 py-4 font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Keep Booking
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isCancelling} 
                  className="flex-1 py-4 font-bold text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center"
                >
                  {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
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
            <div className="bg-green-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">Available</div>
          ) : (
            <div className="bg-gray-900/90 backdrop-blur-sm text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">Booked until {nextDate}</div>
          )}
        </div>
        <button 
          onClick={handleHeartClick}
          disabled={isRemoving}
          className="absolute top-3 right-3 text-white hover:scale-110 transition-transform drop-shadow-md z-10 bg-black/20 p-1.5 rounded-full backdrop-blur-sm"
        >
          {isRemoving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Heart className="w-5 h-5 fill-brand-primary stroke-brand-primary" />}
        </button>
      </div>

      <div className="flex flex-col text-gray-900 px-1 pb-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-sm leading-tight truncate pr-4 text-gray-900">{property.address?.city || 'Location unavailable'}</h3>
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


function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// --- MAIN DASHBOARD COMPONENT ---
export default function GuestDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'ALL');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  const [favorites, setFavorites] = useState([]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const isHost = String(user?.role || '').toUpperCase() === 'LANDLORD';
  
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const TABS = [
    { id: 'ALL', label: 'All Trips', icon: LayoutGrid },
    { id: 'SHORTLET', label: 'Shortlets', icon: Home },
    { id: 'CAR', label: 'Car Rentals', icon: CarFront },
    { id: 'HOTEL', label: 'Hotels', icon: Hotel },
    { id: 'VIP', label: 'VIP Assets', icon: Crown },
    { id: 'FAVORITES', label: 'Saved Stays', icon: Heart },
    { id: 'SETTINGS', label: 'Account Settings', icon: Settings },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [propertyRes, carRes, hotelRes, favRes, profileRes] = await Promise.allSettled([
          getMyPropertyBookings(),
          getMyCarBookings(),
          getMyHotelBookings(),
          getMyFavoritesApi(),
          getMyProfileApi()
        ]);

        let unifiedBookings = [];

        if (propertyRes.status === 'fulfilled' && propertyRes.value.data?.bookings) {
          // 💡 NEW: Map raw properties to distinguish VIP_SERVICE
          const reservations = propertyRes.value.data.bookings.map(b => {
            let trueType = 'SHORTLET';
            if (b.propertyId?.category === 'HOTEL' || b.type === 'HOTEL') {
              trueType = 'HOTEL';
            } else if (b.propertyId?.category === 'VIP_SERVICE') {
              trueType = 'VIP_SERVICE';
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

        if (profileRes.status === 'fulfilled' && profileRes.value.data?.user) {
          setProfileForm({
            firstName: profileRes.value.data.user.firstName || '',
            lastName: profileRes.value.data.user.lastName || '',
            phoneNumber: profileRes.value.data.user.phoneNumber || ''
          });
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
        if (type === 'CAR') updated.guestConfirmedPickup = true; 
        else updated.checkInConfirmedByGuest = true;
        
        if (isPayoutReleased) {
          if (type === 'CAR') updated.escrowStatus = 'RELEASED';
          else updated.payoutStatus = 'RELEASED_TO_LANDLORD';
        }
        return updated;
      }
      return booking;
    }));
  };

  const handleCancelSuccess = (reservationId) => {
    setBookings(prev => prev.map(booking => 
      booking._id === reservationId ? { ...booking, reservationStatus: 'CANCELLED', payoutStatus: 'REFUND_PENDING' } : booking
    ));
  };

  const handleRemoveFavorite = (propertyId) => {
    setFavorites(prev => prev.filter(p => (p._id || p.id) !== propertyId));
    setToastMessage("Property removed from Saved Stays.");
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateMyProfileApi(profileForm);
      setToastMessage("Profile updated successfully.");
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setToastMessage("Failed to update profile.");
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteMyAccountApi();
      logout(); 
      navigate('/'); 
    } catch (error) {
      console.error(error);
      setToastMessage("Failed to delete account. Please ensure all active bookings are closed.");
      setTimeout(() => setToastMessage(''), 4000);
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'NOTIFICATIONS') return;
    setNotifsLoading(true);
    const extract = (res) => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.notifications)) return res.data.notifications;
      if (Array.isArray(res?.notifications)) return res.notifications;
      return [];
    };
    const load = async () => {
      try {
        if (isHost) {
          const [guestRes, hostRes] = await Promise.allSettled([
            getNotifications(),
            apiClient.get('/notifications?role=host').then(r => r.data).catch(() => []),
          ]);
          const guestList = (guestRes.status === 'fulfilled' ? extract(guestRes.value) : []).map(n => ({ ...n, _audience: n._audience || n.audience || 'guest' }));
          const hostList = (hostRes.status === 'fulfilled' ? extract(hostRes.value) : []).map(n => ({ ...n, _audience: 'host' }));
          const byId = new Map();
          [...guestList, ...hostList].forEach(n => byId.set(n._id, n));
          setNotifications([...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } else {
          const res = await getNotifications();
          setNotifications(extract(res).map(n => ({ ...n, _audience: 'guest' })));
        }
      } catch { setNotifications([]); }
      finally { setNotifsLoading(false); }
    };
    load();
  }, [activeTab]);

  const handleMarkRead = async (id) => {
    try { await markNotificationRead(id); setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n)); } catch {}
  };
  const handleMarkAllRead = async () => {
    try { await markAllNotificationsRead(); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch {}
  };
  const handleDeleteNotif = async (id) => {
    try { await deleteNotification(id); setNotifications(prev => prev.filter(n => n._id !== id)); } catch {}
  };
  const handleClearAll = async () => {
    setClearing(true);
    for (const n of [...notifications]) { try { await deleteNotification(n._id); } catch {} }
    setNotifications([]); setClearing(false); setClearConfirm(false);
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = safeNotifications.filter(n => {
    if (!isHost || notifFilter === 'all') return true;
    return (n._audience || n.audience || 'guest') === notifFilter;
  });

  // 💡 NEW: Ensure VIP tab renders both Venues and Services
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'VIP') return b.type === 'VIP' || b.type === 'VIP_SERVICE';
    return b.type === activeTab;
  });

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
              const isSettingsTab = tab.id === 'SETTINGS';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all text-left
                    ${isActive ? isVipTab ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}
                    ${isSettingsTab && !isActive ? 'mt-4 border border-gray-200 bg-white' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive && !isVipTab ? 'text-brand-primary' : ''}`} />
                  <span className="whitespace-nowrap flex-1">{tab.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 hidden lg:block opacity-50" />}
                </button>
              );
            })}

            <div className="hidden lg:block my-4 border-t border-gray-200"></div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all text-left bg-gradient-to-br from-brand-primary/10 to-transparent hover:bg-brand-primary/20 text-brand-dark border border-brand-primary/20"
            >
              <div className="bg-brand-primary/20 p-1.5 rounded-lg">
                <Crown className="w-4 h-4 text-brand-primary" />
              </div>
              <span className="whitespace-nowrap flex-1">Become a Host</span>
              <ChevronRight className="w-4 h-4 text-brand-primary/50" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
              <p className="font-medium text-lg">Loading your dashboard...</p>
            </div>
          ) : activeTab === 'NOTIFICATIONS' ? (
            <div className="max-w-3xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h2>
                <div className="flex items-center gap-3">
                  {safeNotifications.some(n => !n.isRead) && (
                    <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                      Mark all read
                    </button>
                  )}
                  {safeNotifications.length > 0 && !clearConfirm && (
                    <button onClick={() => setClearConfirm(true)} className="flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-600 transition-colors">
                      Clear all
                    </button>
                  )}
                  {clearConfirm && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 font-medium">Delete all?</span>
                      <button onClick={handleClearAll} disabled={clearing} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-60">
                        {clearing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Yes'}
                      </button>
                      <button onClick={() => setClearConfirm(false)} className="px-3 py-1 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors">No</button>
                    </div>
                  )}
                </div>
              </div>

              {isHost && (
                <div className="flex gap-2 mb-6">
                  {[{ key: 'all', label: 'All' }, { key: 'guest', label: 'As Guest' }, { key: 'host', label: 'As Host' }].map(({ key, label }) => (
                    <button key={key} onClick={() => setNotifFilter(key)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${notifFilter === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                      {label}
                      {key !== 'all' && <span className="ml-1.5 text-xs opacity-70">({safeNotifications.filter(n => (n._audience || n.audience || 'guest') === key).length})</span>}
                    </button>
                  ))}
                </div>
              )}

              {notifsLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  <span className="font-medium">Loading notifications...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">All caught up</h3>
                  <p className="text-gray-400 text-sm mt-1">No notifications here.</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden divide-y divide-gray-100 border border-gray-200">
                  {filteredNotifications.map((n) => {
                    const isUnread = !n.isRead;
                    const audience = n._audience || n.audience || 'guest';
                    const bookingId = n.bookingId || n.reservationId || n.relatedId;
                    const bookingLink = bookingId ? `/bookings/${bookingId}` : (n.link || n.url || null);
                    const CardEl = bookingLink ? Link : 'div';
                    const cardProps = bookingLink ? { to: bookingLink, onClick: () => isUnread && handleMarkRead(n._id) } : { onClick: () => isUnread && handleMarkRead(n._id) };
                    return (
                      <CardEl key={n._id} {...cardProps} className={`flex gap-0 transition-colors ${bookingLink ? 'cursor-pointer' : ''} ${isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-gray-50/60'}`}>
                        <div className={`w-1 shrink-0 self-stretch ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`} />
                        <div className="flex gap-4 p-5 flex-1 min-w-0">
                          <div className="mt-1 shrink-0">
                            {isUnread ? <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <p className={`leading-snug ${isUnread ? 'font-bold text-gray-900 text-[15px]' : 'font-medium text-gray-500 text-sm'}`}>{n.title || n.heading}</p>
                              {isUnread && <span className="shrink-0 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full tracking-wide uppercase">New</span>}
                              {isHost && (
                                <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full tracking-wide uppercase ${audience === 'host' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {audience === 'host' ? 'Host' : 'Guest'}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 leading-relaxed ${isUnread ? 'text-gray-700' : 'text-gray-400'}`}>{n.message || n.body}</p>
                            <p className={`text-xs font-medium mt-2 ${isUnread ? 'text-blue-500' : 'text-gray-300'}`}>{n.createdAt ? timeAgo(n.createdAt) : ''}</p>
                          </div>
                          <div className="flex items-start gap-1 shrink-0">
                            {isUnread && (
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkRead(n._id); }} title="Mark as read" className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteNotif(n._id); }} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardEl>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'SETTINGS' ? (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-6">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={profileForm.phoneNumber} onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" />
                    </div>
                  </div>
                  <button type="submit" disabled={isUpdatingProfile} className="mt-4 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70">
                    {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50/50 rounded-3xl border border-red-100 p-8 shadow-sm">
                <h2 className="text-lg font-black text-red-900 mb-2 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/> Danger Zone</h2>
                <p className="text-sm font-medium text-red-700/80 mb-6">Permanently delete your account and all associated data. This action is irreversible.</p>
                <button onClick={() => setIsDeleteModalOpen(true)} className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-red-600/20 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
                </button>
              </div>
            </div>
          ) : activeTab === 'FAVORITES' ? (
            favorites.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Heart className="w-8 h-8 text-gray-300" /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No saved stays yet</h3>
                <p className="text-gray-500 font-medium">Properties you favorite will appear here for easy booking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {favorites.map((fav) => <FavoriteCard key={fav._id || fav.id} property={fav} onRemove={handleRemoveFavorite} />)}
              </div>
            )
          ) : (
            filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Calendar className="w-8 h-8 text-gray-300" /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500 font-medium">You don't have any {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} reservations yet.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <BookingCard 
                  key={booking._id} 
                  booking={booking} 
                  onConfirmEscrow={handleEscrowSuccess} 
                  onCancelSuccess={handleCancelSuccess}
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
            <div className="bg-green-500 p-1 rounded-full"><CheckCircle className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      <HostUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
              This action is permanent and cannot be undone. All your personal data, saved favorites, and history will be wiped. 
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="flex-1 py-4 font-bold text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center">
                {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete It'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}