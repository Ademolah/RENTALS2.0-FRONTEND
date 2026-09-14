import { useState } from 'react';
import { 
  MapPin, Calendar, ShieldCheck, CheckCircle2, 
  Settings, Bell, ChevronRight, LogOut, Clock, 
  User, CreditCard, Key, ArrowUpRight, Loader2
} from 'lucide-react';

export default function GuestDashboard() {
  const [activeTab, setActiveTab] = useState('trips');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // Mock User Data (Replace with your AuthContext)
  const user = {
    firstName: 'Alex',
    lastName: 'Jonathan',
    email: 'alex.jonathan@example.com',
    memberSince: '2026'
  };

  // Mock Active Trip (Replace with API fetch: /api/reservations/me?status=active)
  const activeTrip = {
    id: 'RES-89234',
    propertyName: 'Minimalist Lagoon Parkview Apartment',
    location: 'Lekki Phase 1, Lagos',
    checkIn: '2026-09-15',
    checkOut: '2026-09-20',
    totalPaid: 250000,
    image: 'https://res.cloudinary.com/wcduu38s/image/upload/v1789136264/rentals/properties/vjbpy1b40aesihdh5dng.jpg',
    hostName: 'Oyinmax Luxury'
  };

  // Mock Past Trips
  const pastTrips = [
    {
      id: 'RES-77211',
      propertyName: 'Eko Atlantic Oceanfront Penthouse',
      dates: 'Aug 10 - Aug 14, 2026',
      status: 'Completed'
    }
  ];

  // The Escrow Trigger
  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      // API Call to your backend to update reservation status & trigger landlord payout
      // await releaseEscrowPayment(activeTrip.id);
      
      // Simulate network request
      await new Promise(res => setTimeout(res, 2000));
      setHasCheckedIn(true);
    } catch (error) {
      console.error("Failed to release escrow:", error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-gray-900 selection:text-white">
      
      {/* 1. TOP NAVIGATION HUB */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Branding / Greeting */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.firstName[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
                  Welcome back, {user.firstName}
                </h1>
              </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex space-x-8">
              {['trips', 'notifications', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize font-semibold text-sm transition-all duration-200 border-b-2 py-7 ${
                    activeTab === tab 
                      ? 'border-gray-900 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mobile Tab Icons */}
            <div className="flex md:hidden space-x-6">
              <button onClick={() => setActiveTab('trips')} className={activeTab === 'trips' ? 'text-gray-900' : 'text-gray-400'}>
                <MapPin className="w-6 h-6" />
              </button>
              <button onClick={() => setActiveTab('notifications')} className={activeTab === 'notifications' ? 'text-gray-900' : 'text-gray-400'}>
                <Bell className="w-6 h-6" />
              </button>
              <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400'}>
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* === TRIPS TAB === */}
        {activeTab === 'trips' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* Active / Upcoming Itinerary */}
            <section>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Current Itinerary</h2>
              
              {activeTrip ? (
                <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden flex flex-col lg:flex-row transition-all hover:border-gray-300 shadow-sm">
                  
                  {/* Left: Property Hero */}
                  <div className="lg:w-2/5 relative h-64 lg:h-auto">
                    <img 
                      src={activeTrip.image} 
                      alt={activeTrip.propertyName} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-gray-900">
                      {hasCheckedIn ? 'Active Stay' : 'Upcoming Stay'}
                    </div>
                  </div>

                  {/* Right: Booking Intelligence */}
                  <div className="lg:w-3/5 p-6 md:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 leading-tight pr-4">
                          {activeTrip.propertyName}
                        </h3>
                      </div>
                      <p className="text-gray-500 font-medium flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        {activeTrip.location}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 my-8 py-6 border-y border-gray-100">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Check-in</p>
                        <p className="font-bold text-gray-900">{new Date(activeTrip.checkIn).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p className="text-sm text-gray-500 mt-0.5">3:00 PM</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Checkout</p>
                        <p className="font-bold text-gray-900">{new Date(activeTrip.checkOut).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p className="text-sm text-gray-500 mt-0.5">11:00 AM</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="w-full sm:w-auto">
                        <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-0.5">Total Secured</p>
                        <p className="text-xl font-bold text-gray-900 tracking-tight">₦{activeTrip.totalPaid.toLocaleString()}</p>
                      </div>

                      {/* THE ESCROW TRIGGER BUTTON */}
                      <div className="w-full sm:w-auto flex-shrink-0">
                        {hasCheckedIn ? (
                          <div className="flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 px-8 py-4 rounded-xl border border-emerald-100 font-bold w-full">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Checked In Successfully</span>
                          </div>
                        ) : (
                          <button 
                            onClick={handleCheckIn}
                            disabled={isCheckingIn}
                            className="group relative w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center space-x-2 overflow-hidden"
                          >
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            {isCheckingIn ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-5 h-5" />
                                <span>Confirm Check-in</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!hasCheckedIn && (
                      <p className="text-xs text-gray-400 mt-4 text-center sm:text-right font-medium">
                        Clicking this confirms your arrival and releases the secure escrow payment to the host.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-[2rem] p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No upcoming trips</h3>
                  <p className="text-gray-500 mt-2">When you're ready to plan your next journey, we're here.</p>
                </div>
              )}
            </section>

            {/* Past Trips List */}
            <section>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6">Where you've been</h2>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {pastTrips.map(trip => (
                    <li key={trip.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{trip.propertyName}</p>
                          <p className="text-sm text-gray-500 font-medium">{trip.dates}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                          {trip.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* === NOTIFICATIONS TAB === */}
        {activeTab === 'notifications' && (
          <div className="max-w-3xl animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Notifications</h2>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              <div className="p-6 hover:bg-gray-50 transition-colors flex gap-4">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Check-in Instructions Available</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">Your host for Minimalist Lagoon Parkview Apartment has provided the smart lock codes for your arrival tomorrow.</p>
                  <p className="text-xs text-gray-400 font-medium mt-2">2 hours ago</p>
                </div>
              </div>
              <div className="p-6 hover:bg-gray-50 transition-colors flex gap-4 opacity-75">
                <div className="mt-1 w-2 h-2"></div>
                <div>
                  <p className="font-bold text-gray-900">Payment Secured</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">Your payment of ₦250,000 has been securely locked in escrow for your upcoming stay.</p>
                  <p className="text-xs text-gray-400 font-medium mt-2">Sep 10, 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Profile & Settings</h2>
            
            {/* Profile Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 flex items-center space-x-6">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                {user.firstName[0]}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                <p className="text-gray-500 font-medium">{user.email}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Guest since {user.memberSince}</p>
              </div>
            </div>

            {/* Settings List */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <User className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                  <span className="font-bold text-gray-900">Personal Information</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900" />
              </button>
              <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                  <span className="font-bold text-gray-900">Payments & Payouts</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900" />
              </button>
              <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <Key className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                  <span className="font-bold text-gray-900">Login & Security</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900" />
              </button>
            </div>

            <button className="mt-8 flex items-center space-x-2 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        )}

      </main>
    </div>
  );
}