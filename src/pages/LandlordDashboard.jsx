import  { useState, useEffect } from 'react';
import { 
  Building, Car, Hotel, Crown, Plus, ShieldCheck, 
  CheckCircle, Clock, MapPin, Calendar, Users, Edit3, Loader2, ArrowRight, Landmark
} from 'lucide-react';

import { getLandlordPropertyBookings, confirmPropertyCheckIn } from '../api/properties';
import { getLandlordCarBookings, confirmCarHandover } from '../api/car';
import BankSetupModal from '../components/BankSetupModal';
import PayoutActionCard from '../components/PayoutActionCard';

export default function LandlordDashboard() {
  const [activeTab, setActiveTab] = useState('ACTION_FEED');
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // 1. REAL DATA FETCHING & NORMALIZATION
  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const [propResponse, carResponse] = await Promise.all([
        getLandlordPropertyBookings(), 
        getLandlordCarBookings()
      ]);

      // SURGICAL FIX: Robust extraction mapping exactly to your console log structure
      const propData = propResponse?.data?.bookings || [];
      const carData = carResponse?.data?.bookings || [];



      // Normalize Property Bookings
      const normalizedProps = propData.map(b => {
        
        // SURGICAL FIX: Safely parse the address object into a string
        const addr = b.propertyId?.address;
        const locationString = addr 
          ? (typeof addr === 'object' 
              ? `${addr.city || ''}, ${addr.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '') // Strips trailing commas
              : addr) 
          : 'Location hidden';

        return {
          _id: b._id,
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
            location: locationString || 'Location hidden', // Using the parsed string here
            image: b.propertyId?.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'
          },
          createdAt: new Date(b.createdAt)
        };
      });

      // Normalize Car Bookings
      const normalizedCars = carData.map(b => ({
        _id: b._id,
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
          image: b.carId?.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'
        },
        createdAt: new Date(b.createdAt)
      }));

      // Merge and sort by newest first
      const combined = [...normalizedProps, ...normalizedCars].sort((a, b) => b.createdAt - a.createdAt);
      setBookings(combined);

    } catch (error) {
      console.error("Failed to load portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. REAL ESCROW CONFIRMATION
  // 2. REAL ESCROW CONFIRMATION & PAYOUT EXECUTION
  const handleEscrowConfirm = async (booking) => {
    const { _id: id, type } = booking;
    const isCar = type === 'CAR';
    
    // Check if the guest already did their part of the handshake
    const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
    
    setProcessingId(id);
    try {
      // Step 1: Always confirm the host's side in the database first
      if (isCar) {
        await confirmCarHandover(id);
      } else {
        await confirmPropertyCheckIn(id);
      }

      // Step 2: The Magic - If guest already confirmed, execute the Paystack payout!
      let isPayoutReleased = false;
      if (hasGuestConfirmed) {
        await executePayout(id);
        isPayoutReleased = true;
      }
      
      // Step 3: Update the local UI state dynamically
      setBookings(prev => prev.map(b => {
        if (b._id === id) {
          const updated = { ...b };
          if (isCar) updated.ownerConfirmedHandover = true;
          else updated.checkInConfirmedByHost = true;

          // If the transfer went through, instantly turn the UI badge green!
          if (isPayoutReleased) {
            updated.escrowStatus = 'RELEASED';
          }
          return updated;
        }
        return b;
      }));

      // Success Feedback
      if (isPayoutReleased) {
        alert("Handshake complete! Funds have been released to your bank account.");
      } else {
        alert("Handover confirmed. Awaiting guest confirmation to release funds.");
      }

    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to confirm handover.';
      alert(`Action Failed: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* ARCHITECTURAL HEADER */}
      <div className="border-b border-gray-200 sticky top-0 z-40 bg-white/90 backdrop-blur-md">
  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      
      {/* TITLE SECTION */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-[1px] w-8 bg-brand-primary"></div>
          <span className="text-brand-primary text-[10px] font-extrabold uppercase tracking-[0.2em]">
            Host Portal
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Portfolio</h1>
      </div>
      
      {/* ACTION BUTTONS GROUP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        
        {/* PAYOUTS BUTTON */}
        <button 
          onClick={() => setIsBankModalOpen(true)}
          className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-gray-200 hover:border-gray-900 text-gray-900 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-3 group"
        >
          <Landmark className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
          <span>Setup Payouts</span>
        </button>

        {/* PRISTINE DROPDOWN BUTTON */}
        <div className="relative w-full sm:w-auto">
          <button 
            onClick={() => setIsListMenuOpen(!isListMenuOpen)}
            className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-black text-white text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-3 group"
          >
            <span>Add Asset</span>
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {isListMenuOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-72 bg-white border border-gray-900 shadow-2xl z-50">
              <button className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 border-b border-gray-100 transition-colors group">
                <Building className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Property</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Apartment • Shortlet</div>
                </div>
              </button>
              <button className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 border-b border-gray-100 transition-colors group">
                <Car className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Vehicle</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Rental • Chauffeur</div>
                </div>
              </button>
              <button className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 border-b border-gray-100 transition-colors group">
                <Hotel className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">Hotel</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Hotels</div>
                </div>
              </button>
              <button className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-gray-50 transition-colors group">
                <Crown className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
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

      {/* STRICT TAB NAVIGATION */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12">
        <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-10 border-b border-gray-200">
          {['ACTION_FEED', 'SHORTLETS', 'CARS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 whitespace-nowrap text-xs font-bold uppercase tracking-[0.15em] transition-colors relative ${
                activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'ACTION_FEED' ? 'Ledger & Actions' : `My ${tab}`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
        
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-gray-400">Syncing Ledger...</p>
          </div>
        ) : activeTab === 'ACTION_FEED' && bookings.length > 0 ? (
          <div className="space-y-8">
            {bookings.map((booking) => {
              const isCar = booking.type === 'CAR';
              const isReleased = booking.escrowStatus === 'RELEASED';
              const hasHostConfirmed = isCar ? booking.ownerConfirmedHandover : booking.checkInConfirmedByHost;
              const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
              const isCurrentlyConfirming = processingId === booking._id;

              return (
                <div key={booking._id} className="border border-gray-200 hover:border-gray-900 transition-colors p-6 relative group bg-white flex flex-col lg:flex-row gap-8">
                  
                  {/* Category Identifier */}
                  <div className="absolute top-0 left-0 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 z-10">
                    {isCar ? 'Vehicle' : 'Property'}
                  </div>

                  {/* Asset Image */}
                  <div className="w-full lg:w-64 h-48 lg:h-auto relative overflow-hidden bg-gray-100 shrink-0">
                    <img 
                      src={booking.asset.image} 
                      alt={booking.asset.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-2">
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{booking.asset.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm font-medium">
                          <MapPin className="w-4 h-4 mr-2" /> {booking.asset.location}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4">
                          <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest</div>
                          <div className="col-span-2 text-sm font-bold text-gray-900">
                            {booking.guest.firstName} {booking.guest.lastName}
                            <span className="block text-gray-500 font-medium">{booking.guest.phone}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dates</div>
                          <div className="col-span-2 text-sm font-bold text-gray-900">{booking.dates}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                       <div className="flex items-center space-x-6">
                         <div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Payout</div>
                           <div className="text-xl font-black text-brand-primary">₦{booking.payoutAmount.toLocaleString()}</div>
                         </div>

                         {/* Escrow Status Badges */}
                         {isReleased ? (
                          <div className="flex items-center space-x-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Released</span>
                          </div>
                        ) : hasHostConfirmed && !hasGuestConfirmed ? (
                          <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> <span>Awaiting Guest</span>
                          </div>
                        ) : hasGuestConfirmed && !hasHostConfirmed ? (
                          <div className="flex items-center space-x-2 text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" /> <span>Guest Confirmed</span>
                          </div>
                        ) : null}
                       </div>

                       {/* Action Button */}
                       {!isReleased && (!hasHostConfirmed || (hasGuestConfirmed && !hasHostConfirmed)) && (
                         <button 
                            onClick={() => handleEscrowConfirm(booking)}
                            disabled={isCurrentlyConfirming}
                            className={`py-3 px-8 text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-all ${
                              hasGuestConfirmed 
                                ? 'bg-brand-primary hover:bg-brand-primary/90 text-white' 
                                : 'bg-gray-900 hover:bg-black text-white'
                            }`}
                          >
                            {isCurrentlyConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm`}
                          </button>
                       )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'SHORTLETS' || activeTab === 'CARS' ? (
          
          /* ASSET PORTFOLIO GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 
              Extracting unique assets from the bookings ledger for MVP rendering.
              In production, map over a dedicated state variable like `myShortlets` fetched from /api/v1/properties/landlord/fleet
            */}
            {Array.from(new Map(bookings.filter(b => b.type === (activeTab === 'SHORTLETS' ? 'SHORTLET' : 'CAR')).map(item => [item.asset.title, item])).values()).map((booking) => (
              <div key={booking.asset.title} className="group cursor-pointer">
                <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden mb-4">
                   <img 
                      src={booking.asset.image} 
                      alt={booking.asset.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-900 shadow-sm">
                      Listed
                    </div>
                </div>
                <h4 className="text-lg font-black text-gray-900 leading-tight mb-1">{booking.asset.title}</h4>
                <div className="flex items-center text-gray-500 text-xs font-medium mb-3">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {booking.asset.location}
                </div>
                <button className="text-[10px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-0.5 hover:text-brand-primary hover:border-brand-primary transition-colors">
                  Edit Details
                </button>
              </div>
            ))}
          </div>

        ) : activeTab === 'ACTION_FEED' && bookings.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">No Active Ledger Entries</h3>
            <p className="text-gray-500 mt-3 max-w-md mx-auto">Your portfolio is currently empty. List a new property or vehicle to begin accepting premium reservations.</p>
          </div>
        ) : null}
      </div>

      <BankSetupModal 
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={() => {
          // Optionally trigger a user profile refetch here to show their connected bank
          console.log("Bank saved successfully!");
        }}
      />

      {activeBookings.map(booking => (
        <PayoutActionCard key={booking._id} booking={booking} />
      ))}
    </main>
  );
}