import React, { useState, useEffect } from 'react';
import { 
  Building, Car, Hotel, Crown, Plus, ShieldCheck, 
  CheckCircle, Clock, MapPin, Loader2, Landmark, Wallet, TrendingUp
} from 'lucide-react';

import { getLandlordPropertyBookings, confirmPropertyCheckIn } from '../api/properties';
import { getLandlordCarBookings, confirmCarHandover } from '../api/car';
import { getLandlordHotelBookings, confirmHotelCheckIn, getLandlordHotels } from '../api/hotel'; 

import BankSetupModal from '../components/BankSetupModal';
import AddPropertyModal from '../components/AddPropertyModal';
import AddCarModal from '../components/AddCarModal';
import CreateHotelModal from '../components/CreateHotelModal';
import EditCarModal from '../components/EditCarModal';
import EditPropertyModal from '../components/EditPropertyModal';


export default function LandlordDashboard() {
  const [activeTab, setActiveTab] = useState('ACTION_FEED');
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Modal States
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);
  const [editingPropertyId, setEditingPropertyId] = useState(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      // 1. ADDED rawHotelsResponse to destructuring
      const [propResponse, carResponse, hotelResponse, rawHotelsResponse] = await Promise.all([
        getLandlordPropertyBookings().catch(() => ({ data: { bookings: [] } })), 
        getLandlordCarBookings().catch(() => ({ data: { bookings: [] } })),
        getLandlordHotelBookings().catch(() => ({ data: { bookings: [] } })),
        getLandlordHotels().catch(() => ({ data: { hotels: [] } }))
      ]);

      const propData = propResponse?.data?.bookings || [];
      const carData = carResponse?.data?.bookings || [];
      const hotelData = hotelResponse?.data?.bookings || [];
      
      // 2. EXTRACT raw hotels
      const rawHotels = rawHotelsResponse?.data?.hotels || [];

      // Normalize Property (Shortlet) Bookings
      const normalizedProps = propData.map(b => {
        const addr = b.propertyId?.address;
        const locationString = addr 
          ? (typeof addr === 'object' 
              ? `${addr.city || ''}, ${addr.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
              : addr) 
          : 'Location hidden';

        return {
          _id: b._id,
          assetId: b.propertyId?._id,
          type: 'SHORTLET',
          reservationStatus: b.reservationStatus,
          escrowStatus: b.escrowStatus,
          checkInConfirmedByGuest: b.checkInConfirmedByGuest,
          checkInConfirmedByHost: b.checkInConfirmedByHost,
          payoutAmount: b.totalAmount, 
          dates: `${new Date(b.checkInDate).toLocaleDateString()} - ${new Date(b.checkOutDate).toLocaleDateString()}`,
          guest: { 
            firstName: b.userId?.firstName || 'Guest', 
            lastName: b.userId?.lastName || '', 
            phone: b.userId?.phoneNumber || 'N/A' 
          },
          asset: { 
            title: b.propertyId?.title || 'Property', 
            location: locationString,
            image: b.propertyId?.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
          },
          createdAt: new Date(b.createdAt)
        };
      });

      // Normalize Hotel Bookings
      const normalizedHotels = hotelData.map(b => {
        const addr = b.propertyId?.address;
        const locationString = addr 
          ? (typeof addr === 'object' 
              ? `${addr.city || ''}, ${addr.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
              : addr) 
          : 'Location hidden';

        return {
          _id: b._id,
          type: 'HOTEL',
          reservationStatus: b.reservationStatus,
          escrowStatus: b.escrowStatus,
          checkInConfirmedByGuest: b.checkInConfirmedByGuest,
          checkInConfirmedByHost: b.checkInConfirmedByHost,
          payoutAmount: b.totalAmount, 
          dates: `${new Date(b.checkInDate).toLocaleDateString()} - ${new Date(b.checkOutDate).toLocaleDateString()}`,
          guest: { 
            firstName: b.userId?.firstName || 'Guest', 
            lastName: b.userId?.lastName || '', 
            phone: b.userId?.phoneNumber || 'N/A' 
          },
          asset: { 
            title: b.propertyId?.title || 'Hotel', 
            location: locationString,
            image: b.propertyId?.images?.[0] || 'https://images.unsplash.com/photo-1551882547-ff40eb0d1556?auto=format&fit=crop&w=800&q=80'
          },
          createdAt: new Date(b.createdAt)
        };
      });

      // Normalize Car Bookings
      const normalizedCars = carData.map(b => ({
        _id: b._id,
        assetId: b.carId?._id,
        type: 'CAR',
        reservationStatus: b.reservationStatus,
        escrowStatus: b.escrowStatus,
        guestConfirmedPickup: b.guestConfirmedPickup,
        ownerConfirmedHandover: b.ownerConfirmedHandover,
        payoutAmount: b.totalAmount, 
        dates: `${new Date(b.pickupTime).toLocaleDateString()} - ${new Date(b.dropoffTime).toLocaleDateString()}`,
        guest: { 
          firstName: b.userId?.firstName || 'Guest', 
          lastName: b.userId?.lastName || '', 
          phone: b.userId?.phoneNumber || 'N/A' 
        },
        asset: { 
          title: b.carId ? `${b.carId.make} ${b.carId.carModel} ${b.carId.year}` : 'Vehicle', 
          location: b.carId?.location?.city ? `${b.carId.location.city}, ${b.carId.location.state}` : 'Platform Pickup',
          image: b.carId?.images?.[0] || 'https://images.unsplash.com/photo-1503376760302-83f0453a4574?auto=format&fit=crop&w=800&q=80'
        },
        createdAt: new Date(b.createdAt)
      }));

      // 3. NORMALIZE RAW HOTELS
      const normalizedRawHotels = rawHotels.map(h => {
        const addr = h.address;
        const locationString = addr 
          ? (typeof addr === 'object' 
              ? `${addr.city || ''}, ${addr.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
              : addr) 
          : 'Location hidden';

        return {
          _id: h._id,
          assetId: h._id,
          type: 'HOTEL',
          isRawAsset: true, // Tag to prevent it from showing as an empty booking
          payoutAmount: 0, 
          dates: 'No active bookings',
          guest: { firstName: 'No', lastName: 'Guest Yet', phone: 'N/A' }, // Safe fallback
          asset: { 
            title: h.title || 'Hotel', 
            location: locationString,
            image: h.images?.[0] || 'https://images.unsplash.com/photo-1551882547-ff40eb0d1556?auto=format&fit=crop&w=800&q=80'
          },
          createdAt: new Date(h.createdAt || Date.now())
        };
      });

      // 4. MERGE EVERYTHING (including normalizedRawHotels)
      const allCombined = [...normalizedProps, ...normalizedHotels, ...normalizedCars, ...normalizedRawHotels];
      
      // Deduplicate safely using a Map
      const uniqueBookings = Array.from(new Map(allCombined.map(item => [item._id, item])).values());
      
      // Sort by newest first
      const sorted = uniqueBookings.sort((a, b) => b.createdAt - a.createdAt);
      setBookings(sorted);

    } catch (error) {
      console.error("Failed to load portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscrowConfirm = async (booking) => {
    const { _id: id, type } = booking;
    const isCar = type === 'CAR';
    const isHotel = type === 'HOTEL';
    const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
    
    setProcessingId(id);
    try {
      if (isCar) {
        await confirmCarHandover(id);
      } else if (isHotel) {
        await confirmHotelCheckIn(id); 
      } else {
        await confirmPropertyCheckIn(id);
      }

      let isPayoutReleased = false;
      if (hasGuestConfirmed) {
        isPayoutReleased = true;
      }
      
      setBookings(prev => prev.map(b => {
        if (b._id === id) {
          const updated = { ...b };
          if (isCar) updated.ownerConfirmedHandover = true;
          else updated.checkInConfirmedByHost = true;

          if (isPayoutReleased) updated.escrowStatus = 'RELEASED';
          return updated;
        }
        return b;
      }));

      if (isPayoutReleased) {
        alert("Action complete! Funds have been released to your bank account.");
      } else {
        alert("Action confirmed. Awaiting guest confirmation to release funds.");
      }

    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to execute action.';
      alert(`Action Failed: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssetMenuClick = (type) => {
    setIsListMenuOpen(false);
    if (type === 'PROPERTY') setIsPropertyModalOpen(true);
    else if (type === 'CAR') setIsCarModalOpen(true);
    else if (type === 'HOTEL') setIsHotelModalOpen(true);
    else if (type === 'VIP') alert("VIP Experience module coming soon.");
  };

  const getButtonText = (type, isProcessing) => {
    if (isProcessing) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;
    if (type === 'SHORTLET') return 'Confirm Checkin';
    if (type === 'CAR') return 'Confirm Pickup';
    if (type === 'HOTEL') return 'Guest Checked In';
    return 'Confirm';
  };

  const ledgerEntries = bookings.filter(b => !b.isRawAsset);

  // EARNINGS KPI CALCULATIONS
  const totalClearedEarnings = ledgerEntries.reduce((sum, b) => b.escrowStatus === 'RELEASED' ? sum + b.payoutAmount : sum, 0);
  const pendingEscrow = ledgerEntries.reduce((sum, b) => b.escrowStatus !== 'RELEASED' ? sum + b.payoutAmount : sum, 0);

  const handleManageAsset = (booking) => {
    if (booking.type === 'CAR') setEditingCarId(booking.assetId);
    else if (booking.type === 'HOTEL') alert('Hotel edit module coming soon.');
    else if (booking.type === 'SHORTLET') setEditingPropertyId(booking.assetId);
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-24">
      {/* ARCHITECTURAL HEADER */}
      <div className="border-b border-gray-200 sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-[2px] w-8 bg-brand-primary"></div>
                <span className="text-brand-primary text-[10px] font-extrabold uppercase tracking-[0.2em]">
                  Host Portal
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Portfolio</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setIsBankModalOpen(true)}
                className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-gray-200 hover:border-brand-primary hover:text-brand-primary text-gray-900 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-3 group rounded-xl"
              >
                <Landmark className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                <span>Setup Payouts</span>
              </button>

              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                  className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-black text-white text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-3 group rounded-xl shadow-lg shadow-gray-900/20 active:scale-95"
                >
                  <span>Add Asset</span>
                  <Plus className={`w-4 h-4 transition-transform duration-300 ${isListMenuOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                </button>

                {isListMenuOpen && (
                  <div className="absolute right-0 mt-3 w-full sm:w-72 bg-white border border-gray-100 shadow-2xl z-50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => handleAssetMenuClick('PROPERTY')} className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 border-b border-gray-50 transition-colors group">
                      <Building className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">Property</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Apartment • Shortlet</div>
                      </div>
                    </button>
                    <button onClick={() => handleAssetMenuClick('CAR')} className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 border-b border-gray-50 transition-colors group">
                      <Car className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">Vehicle</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Rental • Chauffeur</div>
                      </div>
                    </button>
                    <button onClick={() => handleAssetMenuClick('HOTEL')} className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 border-b border-gray-50 transition-colors group">
                      <Hotel className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">Hotel</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Boutique • Resort</div>
                      </div>
                    </button>
                    <button onClick={() => handleAssetMenuClick('VIP')} className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 transition-colors group">
                      <Crown className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">VIP Experience</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Exclusive Reservation</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW KPI ROW */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center shadow-sm">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mr-4">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cleared Earnings</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">₦{totalClearedEarnings.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center shadow-sm">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending in Escrow</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">₦{pendingEscrow.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* STRICT TAB NAVIGATION WITH NEW HOTEL TAB */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12">
        <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-8 border-b border-gray-200">
          {['ACTION_FEED', 'SHORTLETS', 'HOTELS', 'CARS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 whitespace-nowrap text-xs font-bold uppercase tracking-[0.15em] transition-colors relative ${
                activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {tab === 'ACTION_FEED' ? 'Ledger & Actions' : `My ${tab}`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

    
      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-gray-400">Syncing Ledger...</p>
          </div>
        ) : activeTab === 'ACTION_FEED' && ledgerEntries.length > 0 ? (
          <div className="space-y-6">
            {ledgerEntries.map((booking) => {
              const isCar = booking.type === 'CAR';
              const isHotel = booking.type === 'HOTEL';
              const isReleased = booking.escrowStatus === 'RELEASED';
              const hasHostConfirmed = isCar ? booking.ownerConfirmedHandover : booking.checkInConfirmedByHost;
              const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
              const isCurrentlyConfirming = processingId === booking._id;

              return (
                <div key={booking._id} className="bg-white border border-gray-100 hover:border-gray-300 hover:shadow-xl transition-all p-6 relative group flex flex-col lg:flex-row gap-8 rounded-2xl overflow-hidden">
                  
                  <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg z-10 shadow-sm">
                    {isCar ? 'Vehicle' : isHotel ? 'Hotel Room' : 'Property'}
                  </div>

                  <div className="w-full lg:w-72 h-56 lg:h-auto relative overflow-hidden bg-gray-100 shrink-0 rounded-xl">
                    <img 
                      src={booking.asset.image} 
                      alt={booking.asset.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight group-hover:text-brand-primary transition-colors">{booking.asset.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm font-medium">
                          <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> {booking.asset.location}
                        </div>
                      </div>
                      
                      <div className="space-y-5 bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest</div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{booking.guest.firstName} {booking.guest.lastName}</div>
                            <div className="text-xs text-gray-500 font-medium">{booking.guest.phone}</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dates</div>
                          <div className="text-sm font-bold text-gray-900">{booking.dates}</div>
                        </div>
                      </div>
                    </div>

                    {/* SURGICAL FIX: Mobile Responsive Action Area */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-gray-100 gap-4">
                       <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                         <div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Payout Amount</div>
                           <div className="text-2xl font-black text-gray-900 tracking-tight">₦{booking.payoutAmount.toLocaleString()}</div>
                         </div>

                         {isReleased ? (
                          <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Funds Released</span>
                          </div>
                        ) : hasHostConfirmed && !hasGuestConfirmed ? (
                          <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Awaiting Guest</span>
                          </div>
                        ) : hasGuestConfirmed && !hasHostConfirmed ? (
                          <div className="flex items-center space-x-2 text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Guest Confirmed</span>
                          </div>
                        ) : null}
                       </div>

                       {!isReleased && (!hasHostConfirmed || (hasGuestConfirmed && !hasHostConfirmed)) && (
                         <button 
                            onClick={() => handleEscrowConfirm(booking)}
                            disabled={isCurrentlyConfirming}
                            className={`w-full sm:w-auto py-3.5 px-4 sm:px-8 text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-all rounded-xl shadow-md active:scale-95 ${
                              hasGuestConfirmed 
                                ? 'bg-brand-primary hover:bg-brand-primary/90 text-white' 
                                : 'bg-gray-900 hover:bg-black text-white'
                            }`}
                          >
                            {getButtonText(booking.type, isCurrentlyConfirming)}
                          </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : ['SHORTLETS', 'CARS', 'HOTELS'].includes(activeTab) ? (
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from(new Map(
              bookings.filter(b => {
                if (activeTab === 'SHORTLETS') return b.type === 'SHORTLET';
                if (activeTab === 'HOTELS') return b.type === 'HOTEL';
                if (activeTab === 'CARS') return b.type === 'CAR';
                return false;
              }).map(item => [item.asset.title, item])
            ).values()).map((booking) => (
              <div key={booking.asset.title} className="group cursor-pointer bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all">
                <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                   <img 
                      src={booking.asset.image} 
                      alt={booking.asset.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-900 shadow-sm">
                      Active
                    </div>
                </div>
                <div className="p-5">
                  <h4 className="text-lg font-black text-gray-900 leading-tight mb-2 truncate group-hover:text-brand-primary transition-colors">{booking.asset.title}</h4>
                  <div className="flex items-center text-gray-500 text-xs font-medium mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> <span className="truncate">{booking.asset.location}</span>
                  </div>
                  <button 
                    onClick={() => handleManageAsset(booking)}
                    className="text-[10px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-0.5 hover:text-brand-primary hover:border-brand-primary transition-colors w-full text-left"
                  >
                    Manage Asset &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>

        ) : activeTab === 'ACTION_FEED' && ledgerEntries.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">No Active Ledger Entries</h3>
            <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">Your portfolio is currently empty. List a new property, vehicle, or hotel to begin accepting premium reservations.</p>
          </div>
        ) : null}
      </div>

      {/* MODALS */}
      <BankSetupModal 
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={() => console.log("Bank saved successfully!")}
      />

      <AddPropertyModal 
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSuccess={() => fetchPortfolioData()}
      />

      <AddCarModal 
        isOpen={isCarModalOpen}
        onClose={() => setIsCarModalOpen(false)}
        onSuccess={() => fetchPortfolioData()}
      />

      <CreateHotelModal 
        isOpen={isHotelModalOpen}
        onClose={() => setIsHotelModalOpen(false)}
        onSuccess={() => fetchPortfolioData()}
      />

      <EditCarModal 
        isOpen={!!editingCarId}
        carId={editingCarId}
        onClose={() => setEditingCarId(null)}
        onSuccess={() => fetchPortfolioData()}
      />

      <EditPropertyModal 
        isOpen={!!editingPropertyId}
        propertyId={editingPropertyId}
        onClose={() => setEditingPropertyId(null)}
        onSuccess={() => fetchPortfolioData()}
      />
    </main>
  );
}