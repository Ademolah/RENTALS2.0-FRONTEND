import React, { useState, useEffect } from 'react';
import { 
  Building, Car, Hotel, Crown, Plus, ShieldCheck, 
  CheckCircle, Clock, MapPin, Loader2, Landmark, Wallet, TrendingUp, BarChart3,
  Star, Receipt, MessageSquare, Eye, EyeOff
} from 'lucide-react';

import { HostService } from '../api/host';
import { getLandlordPropertyBookings, confirmPropertyCheckIn } from '../api/properties';
import { getLandlordCarBookings, confirmCarHandover } from '../api/car';
import { getLandlordHotelBookings, confirmHotelCheckIn } from '../api/hotel'; 
import { confirmVipArrival } from '../api/vip'; 
import { useAuth } from '../context/AuthContext';
import { fetchMyListings, setListingAvailable, fetchHostReviews } from '../components/host/hostApi';

import { Button, Badge, Card, Container, SectionTitle, EmptyState } from '../components/ui';
import BankSetupModal from '../components/BankSetupModal';
import AddPropertyModal from '../components/AddPropertyModal';
import AddCarModal from '../components/AddCarModal';
import CreateHotelModal from '../components/CreateHotelModal';
import AddVipModal from '../components/AddVipModal';
import EditVipModal from '../components/EditVipModal'; 
import EditCarModal from '../components/EditCarModal';
import EditPropertyModal from '../components/EditPropertyModal';
import EditHotelModal from '../components/EditHotelModal';

export default function LandlordDashboard() {
  const [activeTab, setActiveTab] = useState('ACTION_FEED');
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsState, setAnalyticsState] = useState('idle');
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [listingsState, setListingsState] = useState('loading');
  const [togglingId, setTogglingId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsState, setReviewsState] = useState('idle');

  const notify = (message, type = 'error') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadAnalytics = async () => {
    setAnalyticsState('loading');
    try {
      const res = await HostService.getAnalytics();
      const d = res?.data || {};
      const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
      const sm = d.summary || {};
      const rows = Array.isArray(d.chartData) ? d.chartData : [];
      setAnalytics({
        year: num(d.year) || new Date().getFullYear(),
        summary: {
          totalEarnings: num(sm.totalEarnings),
          pendingPayouts: num(sm.pendingPayouts),
          completedPayouts: num(sm.completedPayouts),
          totalBookings: num(sm.totalBookings),
        },
        months: Array.from({ length: 12 }, (_, i) => {
          const m = rows.find((r) => num(r.month) === i + 1) || {};
          return { month: i + 1, totalEarnings: num(m.totalEarnings), bookings: num(m.bookings) };
        }),
      });
      setAnalyticsState('ready');
    } catch (error) {
      setAnalyticsState('error');
    }
  };

  // Modal States
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  
  const [editingCarId, setEditingCarId] = useState(null);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [editingVipId, setEditingVipId] = useState(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  useEffect(() => {
    if (activeTab === 'EARNINGS' && analyticsState === 'idle') loadAnalytics();
    if (activeTab === 'REVIEWS' && reviewsState === 'idle' && listingsState === 'ready') loadReviews();
  }, [activeTab, listingsState]);

  useEffect(() => {
    loadListings();
  }, [user?._id, user?.id]);

  const loadListings = async () => {
    setListingsState('loading');
    try {
      const { items, failed } = await fetchMyListings(user?._id || user?.id);
      setListings(items);
      setListingsState(failed === 4 ? 'error' : 'ready');
      if (failed > 0 && failed < 4) notify('Some of your listings could not be loaded. Refresh to try again.');
    } catch {
      setListingsState('error');
    }
  };

  const loadReviews = async () => {
    setReviewsState('loading');
    try {
      setReviews(await fetchHostReviews(listings));
      setReviewsState('ready');
    } catch {
      setReviewsState('error');
    }
  };

  const handleToggleAvailability = async (listing) => {
    const makeAvailable = listing.status === 'paused';
    setTogglingId(listing.id);
    try {
      await setListingAvailable(listing, makeAvailable);
      setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, status: makeAvailable ? 'active' : 'paused', raw: { ...l.raw, isAvailable: makeAvailable } } : l)));
      notify(makeAvailable ? 'Listing is available again.' : 'Listing marked as unavailable.', 'success');
    } catch (error) {
      notify(error?.response?.data?.message || 'Could not update this listing. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      let failedLoads = 0;
      const safe = (fn, fallback) => fn().catch(() => { failedLoads += 1; return fallback; });
      const [
        propResponse, carResponse, hotelResponse
      ] = await Promise.all([
        safe(getLandlordPropertyBookings, { data: { bookings: [] } }),
        safe(getLandlordCarBookings, { data: { bookings: [] } }),
        safe(getLandlordHotelBookings, { data: { bookings: [] } })
      ]);

      if (failedLoads > 0) notify('Some of your portfolio could not be loaded. Check your connection and refresh.');

      const propData = propResponse?.data?.bookings || [];
      const carData = carResponse?.data?.bookings || [];
      const hotelData = hotelResponse?.data?.bookings || [];
      
      const normalizeLocation = (addr) => {
        return addr 
          ? (typeof addr === 'object' 
              ? `${addr.city || ''}, ${addr.state || ''}`.replace(/(^,\s*)|(,\s*$)/g, '')
              : addr) 
          : 'Location hidden';
      };

      // Normalize Property Bookings (This now catches Shortlets, VIP Venues, AND VIP Services)
      const normalizedProps = propData.map(b => {
        let trueType = 'SHORTLET';
        const category = b.propertyId?.category;
        
        if (category === 'VIP_SERVICE') {
          trueType = 'VIP_SERVICE';
        } else if (category === 'VIP RESERVATION' || category === 'VIP') {
          trueType = 'VIP';
        } else if (category === 'HOTEL') {
          trueType = 'HOTEL';
        }

        // Services use start/end date logic, Venues use checkIn/checkOut. We safely fallback.
        const dateString = b.startDate && b.endDate 
          ? `${new Date(b.startDate).toLocaleDateString()} - ${new Date(b.endDate).toLocaleDateString()}`
          : `${new Date(b.checkInDate).toLocaleDateString()} - ${new Date(b.checkOutDate).toLocaleDateString()}`;

        return {
          _id: b._id,
          assetId: b.propertyId?._id,
          type: trueType,
          reservationStatus: b.reservationStatus,
          escrowStatus: b.escrowStatus,
          checkInConfirmedByGuest: b.guestConfirmedDelivery || b.checkInConfirmedByGuest,
          checkInConfirmedByHost: b.ownerConfirmedDelivery || b.checkInConfirmedByHost,
          payoutAmount: b.totalAmount, 
          dates: dateString,
          asset: { 
            title: b.propertyId?.title || 'Asset', 
            location: normalizeLocation(b.propertyId?.address),
            image: b.propertyId?.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
          },
          createdAt: new Date(b.createdAt)
        };
      });

      const normalizedHotels = hotelData.map(b => ({
        _id: b._id,
        type: 'HOTEL',
        reservationStatus: b.reservationStatus,
        escrowStatus: b.escrowStatus,
        checkInConfirmedByGuest: b.checkInConfirmedByGuest,
        checkInConfirmedByHost: b.checkInConfirmedByHost,
        payoutAmount: b.totalAmount, 
        dates: `${new Date(b.checkInDate).toLocaleDateString()} - ${new Date(b.checkOutDate).toLocaleDateString()}`,
        asset: { 
          title: b.propertyId?.title || 'Hotel', location: normalizeLocation(b.propertyId?.address),
          image: b.propertyId?.images?.[0] || 'https://images.unsplash.com/photo-1551882547-ff40eb0d1556?auto=format&fit=crop&w=800&q=80'
        },
        createdAt: new Date(b.createdAt)
      }));

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
        asset: { 
          title: b.carId ? `${b.carId.make} ${b.carId.carModel} ${b.carId.year}` : 'Vehicle', 
          location: b.carId?.location
        ? [b.carId.location.address, b.carId.location.city, b.carId.location.state]
            .filter(Boolean) 
            .join(', ')
        : 'Platform Pickup',
          image: b.carId?.images?.[0] || 'https://images.unsplash.com/photo-1503376760302-83f0453a4574?auto=format&fit=crop&w=800&q=80'
        },
        createdAt: new Date(b.createdAt)
      }));

      const allCombined = [...normalizedProps, ...normalizedHotels, ...normalizedCars];
      
      const uniqueBookings = Array.from(new Map(allCombined.map(item => [item._id, item])).values());
      const sorted = uniqueBookings.sort((a, b) => b.createdAt - a.createdAt);
      setBookings(sorted);

    } catch (error) {
      console.error("Failed to load portfolio data:", error);
      notify("Could not load your portfolio. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscrowConfirm = async (booking) => {
    const { _id: id, type } = booking;
    const isCar = type === 'CAR';
    const isHotel = type === 'HOTEL';
    const isVip = type === 'VIP' || type === 'VIP_SERVICE'; 
    
    const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
    
    setProcessingId(id);
    try {
      if (isCar) {
        await confirmCarHandover(id);
      } else if (isHotel) {
        await confirmHotelCheckIn(id); 
      } else if (isVip) {
        // Both Venues and Services use the same backend engine
        await confirmVipArrival(id); 
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
        notify('Action complete. Funds have been released to your bank account.', 'success');
      } else {
        notify('Action confirmed. Awaiting guest confirmation to release funds.', 'success');
      }

    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to execute action.';
      notify(`Action failed: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssetMenuClick = (type) => {
    setIsListMenuOpen(false);
    if (type === 'PROPERTY') setIsPropertyModalOpen(true);
    else if (type === 'CAR') setIsCarModalOpen(true);
    else if (type === 'HOTEL') setIsHotelModalOpen(true);
    else if (type === 'VIP') setIsVipModalOpen(true); 
  };

  const getButtonText = (type, isProcessing) => {
    if (isProcessing) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;
    if (type === 'SHORTLET') return 'Confirm Checkin';
    if (type === 'CAR') return 'Confirm Pickup';
    if (type === 'HOTEL') return 'Guest Checked In';
    if (type === 'VIP') return 'Confirm Arrival'; 
    if (type === 'VIP_SERVICE') return 'Confirm Service Delivery'; 
    return 'Confirm';
  };

  const refOf = (b) => String(b._id).slice(-6).toUpperCase();
  const ledgerEntries = bookings;

  const totalClearedEarnings = ledgerEntries.reduce((sum, b) => b.escrowStatus === 'RELEASED' ? sum + b.payoutAmount : sum, 0);
  const pendingEscrow = ledgerEntries.reduce((sum, b) => b.escrowStatus !== 'RELEASED' ? sum + b.payoutAmount : sum, 0);

  const NAV_ITEMS = [
    { id: 'ACTION_FEED', label: 'Ledger & Actions', icon: ShieldCheck },
    { id: 'BOOKINGS', label: 'Bookings', icon: Receipt },
    { id: 'EARNINGS', label: 'Earnings', icon: BarChart3 },
    { id: 'REVIEWS', label: 'Reviews', icon: MessageSquare },
    { id: 'SHORTLETS', label: 'My Shortlets', icon: Building },
    { id: 'HOTELS', label: 'My Hotels', icon: Hotel },
    { id: 'CARS', label: 'My Cars', icon: Car },
    { id: 'VIP ASSETS', label: 'VIP Assets', icon: Crown },
  ];

  const assetsForTab = listings.filter((l) => {
    if (activeTab === 'SHORTLETS') return l.type === 'SHORTLET';
    if (activeTab === 'HOTELS') return l.type === 'HOTEL';
    if (activeTab === 'CARS') return l.type === 'CAR';
    if (activeTab === 'VIP ASSETS') return l.type === 'VIP' || l.type === 'VIP_SERVICE';
    return false;
  });

  const STATUS_BADGE = {
    active: { tone: 'green', label: 'Live' },
    paused: { tone: 'gray', label: 'Unavailable' },
    pending: { tone: 'amber', label: 'Pending approval' },
    rejected: { tone: 'brand', label: 'Rejected' },
  };

  const handleManageListing = (l) => {
    if (l.type === 'CAR') setEditingCarId(l.id);
    else if (l.type === 'SHORTLET') setEditingPropertyId(l.id);
    else if (l.type === 'HOTEL') setEditingHotelId(l.id);
    else setEditingVipId(l.id);
  };

  const typeLabel = (t) =>
    t === 'CAR' ? 'Vehicle' : t === 'HOTEL' ? 'Hotel Room' : t === 'VIP_SERVICE' ? 'VIP Service' : t === 'VIP' ? 'VIP Reservation' : 'Property';

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* PAGE HEADER */}
      <div className="bg-white border-b border-gray-100">
        <Container className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-primary mb-2">Host Portal</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-dark tracking-tight">Portfolio</h1>
              <p className="text-base text-brand-text-secondary mt-1">Manage your listings, reservations and payouts.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <Button variant="outline" onClick={() => setIsBankModalOpen(true)}>
                <Landmark className="w-5 h-5 text-brand-text-muted" />
                <span>Setup Payouts</span>
              </Button>

              <div className="relative w-full sm:w-auto">
                <Button variant="dark" onClick={() => setIsListMenuOpen(!isListMenuOpen)} className="w-full sm:w-auto">
                  <span>Add Asset</span>
                  <Plus className={`w-5 h-5 transition-transform duration-300 ${isListMenuOpen ? 'rotate-45' : ''}`} />
                </Button>

                {isListMenuOpen && (
                  <div className="absolute right-0 mt-3 w-full sm:w-80 bg-white border border-gray-100 shadow-elevated z-50 rounded-2xl overflow-hidden animate-fade-up">
                    {[
                      { key: 'PROPERTY', label: 'Property', sub: 'Apartment • Shortlet', icon: Building, color: 'text-brand-primary bg-brand-primary-soft' },
                      { key: 'CAR', label: 'Vehicle', sub: 'Rental • Chauffeur', icon: Car, color: 'text-brand-purple bg-brand-purple-soft' },
                      { key: 'HOTEL', label: 'Hotel', sub: 'Boutique • Resort', icon: Hotel, color: 'text-blue-600 bg-blue-50' },
                      { key: 'VIP', label: 'VIP Asset', sub: 'Venue • Service • Security', icon: Crown, color: 'text-amber-600 bg-amber-50' },
                    ].map((o) => {
                      const Icon = o.icon;
                      return (
                        <button key={o.key} onClick={() => handleAssetMenuClick(o.key)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${o.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-base font-bold text-brand-dark">{o.label}</div>
                            <div className="text-sm text-brand-text-secondary">{o.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="mt-8">
        {notice && (
          <div role="alert" className={`mb-6 px-5 py-4 rounded-xl text-base font-semibold border ${notice.type === 'success' ? 'bg-status-available-soft text-status-available border-status-available/20' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {notice.message}
          </div>
        )}
        {/* STAT TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-status-available-soft rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-status-available" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary">Cleared earnings</p>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">₦{totalClearedEarnings.toLocaleString()}</h3>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-warning-soft rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-brand-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary">Pending in escrow</p>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">₦{pendingEscrow.toLocaleString()}</h3>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-accent-soft rounded-2xl flex items-center justify-center">
              <Building className="w-7 h-7 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary">Reservations</p>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-dark tracking-tight">{ledgerEntries.length}</h3>
            </div>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* SIDEBAR NAV */}
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <Card className="p-2 flex lg:flex-col overflow-x-auto gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold whitespace-nowrap transition-colors ${
                      active ? 'bg-brand-dark text-white' : 'text-brand-text-secondary hover:bg-gray-50 hover:text-brand-dark'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-primary' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </Card>
          </aside>

          {/* CONTENT AREA */}
          <section className="flex-1 min-w-0 w-full">
            {isLoading ? (
              <div className="py-32 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
                <p className="mt-6 text-base font-semibold text-brand-text-muted">Syncing ledger...</p>
              </div>
            ) : activeTab === 'EARNINGS' ? (
              <div>
                <SectionTitle title="Earnings" subtitle={analytics ? `Your payouts for ${analytics.year}, after the 5% platform commission.` : 'Your payouts for this year.'} />
                {analyticsState === 'loading' || analyticsState === 'idle' ? (
                  <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
                ) : analyticsState === 'error' ? (
                  <Card>
                    <EmptyState icon={BarChart3} title="Earnings unavailable" text="We could not load your earnings right now." action={<Button variant="dark" onClick={loadAnalytics}>Try again</Button>} />
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        ['Total earnings', analytics.summary.totalEarnings, true],
                        ['Paid out', analytics.summary.completedPayouts, true],
                        ['Pending payouts', analytics.summary.pendingPayouts, true],
                        ['Bookings', analytics.summary.totalBookings, false],
                      ].map(([label, value, money]) => (
                        <Card key={label} className="p-5">
                          <p className="text-sm font-semibold text-brand-text-secondary">{label}</p>
                          <p className="text-2xl font-display font-bold text-brand-dark mt-1">{money ? `₦${value.toLocaleString()}` : value}</p>
                        </Card>
                      ))}
                    </div>
                    <Card className="p-6">
                      <h3 className="text-lg font-display font-bold text-brand-dark mb-6">Monthly earnings</h3>
                      <div className="flex items-end gap-2 h-56">
                        {(() => {
                          const max = Math.max(...analytics.months.map((m) => m.totalEarnings), 1);
                          const names = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                          return analytics.months.map((m) => (
                            <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full gap-2" title={`₦${m.totalEarnings.toLocaleString()} · ${m.bookings} bookings`}>
                              <div className="w-full rounded-t-lg bg-brand-primary/80 hover:bg-brand-primary transition-colors" style={{ height: `${Math.max((m.totalEarnings / max) * 100, m.totalEarnings > 0 ? 4 : 1)}%` }} />
                              <span className="text-sm font-semibold text-brand-text-muted">{names[m.month - 1]}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            ) : activeTab === 'ACTION_FEED' && ledgerEntries.length > 0 ? (
              <div className="space-y-5">
                <SectionTitle title="Ledger & Actions" subtitle="Confirm arrivals to release escrowed funds." />
                {ledgerEntries.map((booking) => {
                  const isCar = booking.type === 'CAR';
                  const isVip = booking.type === 'VIP';
                  const isVipService = booking.type === 'VIP_SERVICE';
                  const isReleased = booking.escrowStatus === 'RELEASED';
                  const hasHostConfirmed = isCar ? booking.ownerConfirmedHandover : booking.checkInConfirmedByHost;
                  const hasGuestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
                  const isCurrentlyConfirming = processingId === booking._id;

                  return (
                    <Card key={booking._id} className="p-5 flex flex-col md:flex-row gap-6 overflow-hidden hover:shadow-card-hover transition-shadow">
                      <div className="w-full md:w-60 h-48 md:h-auto relative overflow-hidden bg-gray-100 shrink-0 rounded-xl">
                        <img src={booking.asset.image} alt={booking.asset.title} className="w-full h-full object-cover" />
                        <Badge tone={(isVip || isVipService) ? 'amber' : 'dark'} className="absolute top-3 left-3">{typeLabel(booking.type)}</Badge>
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
                          <div>
                            <h3 className="text-xl font-display font-bold text-brand-dark mb-2 leading-tight">{booking.asset.title}</h3>
                            <div className="flex items-center text-brand-text-secondary text-base">
                              <MapPin className="w-4 h-4 mr-1.5 text-brand-text-muted shrink-0" /> <span className="truncate">{booking.asset.location}</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-sm font-semibold text-brand-text-muted">Booking</span>
                              <div className="text-right">
                                <div className="text-base font-bold text-brand-dark">#{refOf(booking)}</div>
                                <div className="text-sm text-brand-text-secondary">Managed by Rentals Africa</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center gap-3 pt-3 border-t border-gray-200">
                              <span className="text-sm font-semibold text-brand-text-muted">Dates</span>
                              <span className="text-base font-bold text-brand-dark text-right">{booking.dates}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-gray-100 gap-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <div>
                              <div className="text-sm font-semibold text-brand-text-muted">Payout amount</div>
                              <div className="text-2xl font-display font-bold text-brand-dark tracking-tight">₦{booking.payoutAmount.toLocaleString()}</div>
                            </div>

                            {isReleased ? (
                              <Badge tone="green"><CheckCircle className="w-4 h-4" /> Funds Released</Badge>
                            ) : hasHostConfirmed && !hasGuestConfirmed ? (
                              <Badge tone="amber"><Clock className="w-4 h-4" /> Awaiting Client</Badge>
                            ) : hasGuestConfirmed && !hasHostConfirmed ? (
                              <Badge tone="brand"><ShieldCheck className="w-4 h-4" /> Client Confirmed</Badge>
                            ) : null}
                          </div>

                          {!isReleased && (!hasHostConfirmed || (hasGuestConfirmed && !hasHostConfirmed)) && (
                            <Button
                              variant={hasGuestConfirmed ? 'primary' : 'dark'}
                              onClick={() => handleEscrowConfirm(booking)}
                              disabled={isCurrentlyConfirming}
                              className="w-full sm:w-auto"
                            >
                              {getButtonText(booking.type, isCurrentlyConfirming)}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : activeTab === 'BOOKINGS' ? (
              <div>
                <SectionTitle title="Bookings" subtitle="Every reservation on your listings. Guest details are handled by Rentals Africa." />
                {ledgerEntries.length === 0 ? (
                  <Card><EmptyState icon={Receipt} title="No bookings yet" text="Reservations on your listings will appear here." /></Card>
                ) : (
                  <Card className="overflow-x-auto">
                    <table className="w-full text-left text-base">
                      <thead>
                        <tr className="border-b border-gray-100 text-sm uppercase tracking-wider text-brand-text-muted">
                          <th className="px-5 py-4 font-bold">Booking</th>
                          <th className="px-5 py-4 font-bold">Listing</th>
                          <th className="px-5 py-4 font-bold">Dates</th>
                          <th className="px-5 py-4 font-bold text-right">Amount</th>
                          <th className="px-5 py-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerEntries.map((b) => (
                          <tr key={b._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                            <td className="px-5 py-4">
                              <div className="font-bold text-brand-dark">#{refOf(b)}</div>
                              <div className="text-sm text-brand-text-secondary">Managed by Rentals Africa</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-brand-dark">{b.asset.title}</div>
                              <div className="text-sm text-brand-text-secondary">{typeLabel(b.type)}</div>
                            </td>
                            <td className="px-5 py-4 text-brand-text-secondary whitespace-nowrap">{b.dates}</td>
                            <td className="px-5 py-4 text-right font-display font-bold text-brand-dark whitespace-nowrap">₦{(b.payoutAmount || 0).toLocaleString()}</td>
                            <td className="px-5 py-4">
                              {b.escrowStatus === 'RELEASED'
                                ? <Badge tone="green">Funds released</Badge>
                                : <Badge tone="amber">{String(b.reservationStatus || 'Pending').replace(/_/g, ' ')}</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </div>
            ) : activeTab === 'REVIEWS' ? (
              <div>
                <SectionTitle title="Reviews" subtitle="What guests say about your listings." />
                {reviewsState === 'loading' || reviewsState === 'idle' ? (
                  <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
                ) : reviewsState === 'error' ? (
                  <Card><EmptyState icon={MessageSquare} title="Reviews unavailable" text="We could not load your reviews right now." action={<Button variant="dark" onClick={loadReviews}>Try again</Button>} /></Card>
                ) : reviews.length === 0 ? (
                  <Card><EmptyState icon={Star} title="No reviews yet" text="Reviews from guests appear here after their stay." /></Card>
                ) : (
                  <div className="grid gap-4">
                    {reviews.map((r) => (
                      <Card key={r.id} className="p-6">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h4 className="text-lg font-display font-bold text-brand-dark">{r.listing}</h4>
                          <span className="flex items-center gap-1 text-base font-bold text-brand-dark">
                            <Star className="w-5 h-5 fill-brand-star text-brand-star" /> {r.rating.toFixed(1)}
                          </span>
                        </div>
                        {r.comment && <p className="text-base text-brand-text-secondary leading-relaxed">{r.comment}</p>}
                        <p className="text-sm text-brand-text-muted mt-3">
                          Verified guest{r.createdAt ? ` · ${r.createdAt.toLocaleDateString()}` : ''}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : ['SHORTLETS', 'CARS', 'HOTELS', 'VIP ASSETS'].includes(activeTab) ? (
              <div>
                <SectionTitle title={NAV_ITEMS.find((n) => n.id === activeTab)?.label} subtitle="Manage details, pricing and availability." />
                {listingsState === 'loading' ? (
                  <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
                ) : listingsState === 'error' ? (
                  <Card><EmptyState icon={Building} title="Listings unavailable" text="We could not load your listings right now." action={<Button variant="dark" onClick={loadListings}>Try again</Button>} /></Card>
                ) : assetsForTab.length === 0 ? (
                  <Card>
                    <EmptyState icon={Building} title="Nothing here yet" text="Use Add Asset to create your first listing. New listings wait for Rentals Africa approval before guests can see them." />
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assetsForTab.map((l) => {
                      const st = STATUS_BADGE[l.status] || STATUS_BADGE.active;
                      const canToggle = (l.status === 'active' || l.status === 'paused') && l.type !== 'VIP_SERVICE';
                      return (
                        <Card key={l.id} className="group overflow-hidden hover:shadow-card-hover transition-shadow">
                          <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                            <img src={l.image} alt={l.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${l.status === 'paused' ? 'grayscale opacity-70' : ''}`} />
                            <Badge tone={st.tone} className="absolute top-3 left-3 bg-white/95">{st.label}</Badge>
                            <Badge tone={l.type === 'VIP_SERVICE' ? 'amber' : 'gray'} className="absolute top-3 right-3 bg-white/90">{typeLabel(l.type)}</Badge>
                          </div>
                          <div className="p-5">
                            <h4 className="text-lg font-display font-bold text-brand-dark leading-tight mb-1 truncate">{l.title}</h4>
                            <div className="flex items-center text-brand-text-secondary text-base mb-2">
                              <MapPin className="w-4 h-4 mr-1.5 text-brand-text-muted shrink-0" /> <span className="truncate">{l.location}</span>
                            </div>
                            {l.price > 0 && <p className="text-base font-display font-bold text-brand-dark mb-4">₦{l.price.toLocaleString()}</p>}
                            <div className="flex gap-2">
                              <Button variant="soft" size="sm" onClick={() => handleManageListing(l)} className="flex-1">Edit</Button>
                              {canToggle && (
                                <Button variant="outline" size="sm" disabled={togglingId === l.id} onClick={() => handleToggleAvailability(l)} className="flex-1">
                                  {togglingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : l.status === 'paused' ? <><Eye className="w-4 h-4" /> Make available</> : <><EyeOff className="w-4 h-4" /> Mark unavailable</>}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'ACTION_FEED' && ledgerEntries.length === 0 ? (
              <Card>
                <EmptyState
                  icon={ShieldCheck}
                  title="No active ledger entries"
                  text="Your portfolio is currently empty. List a new property, vehicle, or VIP service to begin accepting reservations."
                />
              </Card>
            ) : null}
          </section>
        </div>
      </Container>

      {/* MODALS */}
      <BankSetupModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} onSuccess={() => console.log("Bank saved successfully!")} />
      <AddPropertyModal isOpen={isPropertyModalOpen} onClose={() => setIsPropertyModalOpen(false)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
      <AddCarModal isOpen={isCarModalOpen} onClose={() => setIsCarModalOpen(false)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
      <CreateHotelModal isOpen={isHotelModalOpen} onClose={() => setIsHotelModalOpen(false)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
      <AddVipModal isOpen={isVipModalOpen} onClose={() => setIsVipModalOpen(false)} onEstablishmentAdded={() => { fetchPortfolioData(); loadListings(); }} />

      <EditCarModal isOpen={!!editingCarId} carId={editingCarId} onClose={() => setEditingCarId(null)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
      <EditPropertyModal isOpen={!!editingPropertyId} propertyId={editingPropertyId} onClose={() => setEditingPropertyId(null)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
      <EditHotelModal isOpen={!!editingHotelId} hotelId={editingHotelId} onClose={() => setEditingHotelId(null)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
      <EditVipModal isOpen={!!editingVipId} establishmentId={editingVipId} onClose={() => setEditingVipId(null)} onSuccess={() => { fetchPortfolioData(); loadListings(); }} />
    </main>
  );
}
