import { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Plus, Minus, X, Calendar as CalendarIcon } from 'lucide-react';

const POPULAR_DESTINATIONS = [
  'Ikoyi, Lagos', 'Victoria Island, Lagos', 'Lekki Phase 1, Lagos', 
  'Banana Island, Lagos', 'Ikeja GRA, Lagos', 'Maitama, Abuja'
];

export default function AdvancedSearch({ onSearch }) {
  // State Machine for the Active Pill
  const [activeMenu, setActiveMenu] = useState(null); // 'location' | 'checkIn' | 'checkOut' | 'guests'
  
  // Form Data
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState({ adults: 1, children: 0 });

  // Mobile Modal State
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Click outside to close desktop popovers
  const searchBarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers for auto-advancing the state machine ---
  const handleLocationSelect = (dest) => {
    setLocation(dest);
    setActiveMenu('checkIn'); // Auto-advance to Check-in
  };

  const handleCheckInSelect = (e) => {
    setCheckIn(e.target.value);
    setActiveMenu('checkOut'); // Auto-advance to Check-out
  };

  const handleCheckOutSelect = (e) => {
    setCheckOut(e.target.value);
    setActiveMenu('guests'); // Auto-advance to Guests
  };

  const updateGuests = (type, operation) => {
    setGuests(prev => ({
      ...prev,
      [type]: operation === 'add' 
        ? prev[type] + 1 
        : Math.max(type === 'adults' ? 1 : 0, prev[type] - 1)
    }));
  };

  const executeSearch = (e) => {
    e.stopPropagation();
    setActiveMenu(null);
    setIsMobileModalOpen(false);
    
    // Pass the payload up to Home.jsx to trigger API filter & Map updates
    if (onSearch) {
      onSearch({
        location,
        checkIn,
        checkOut,
        adults: guests.adults,
        children: guests.children
      });
    }
  };

  const totalGuests = guests.adults + guests.children;

  return (
    <div className="w-full flex justify-center mt-4 md:mt-8 px-4 z-40 relative" ref={searchBarRef}>
      
      {/* 
        =========================================
        DESKTOP VIEW: The Interactive Pill
        =========================================
      */}
      <div className={`hidden md:flex relative items-center max-w-4xl w-full rounded-full transition-all duration-300 ${
        activeMenu ? 'bg-gray-100' : 'bg-white border border-gray-200 shadow-search hover:shadow-lg divide-x divide-gray-200'
      }`}>
        
        {/* 1. LOCATION */}
        <button 
          onClick={() => setActiveMenu('location')}
          className={`flex-1 text-left pl-8 pr-4 py-3.5 rounded-full transition-colors relative z-10 ${
            activeMenu === 'location' ? 'bg-white shadow-xl' : 'hover:bg-gray-200/50'
          }`}
        >
          <div className="text-[11px] font-extrabold tracking-widest text-gray-900 uppercase">Where</div>
          <input 
            type="text" 
            placeholder="Search destinations" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 font-medium truncate mt-0.5"
          />
        </button>

        {/* 2. CHECK IN */}
        <button 
          onClick={() => setActiveMenu('checkIn')}
          className={`flex-1 text-left px-6 py-3.5 rounded-full transition-colors relative z-10 ${
            activeMenu === 'checkIn' ? 'bg-white shadow-xl' : 'hover:bg-gray-200/50'
          }`}
        >
          <div className="text-[11px] font-extrabold tracking-widest text-gray-900 uppercase">Check in</div>
          <div className={`text-sm font-medium mt-0.5 ${checkIn ? 'text-gray-900' : 'text-gray-500'}`}>
            {checkIn ? new Date(checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Add dates'}
          </div>
        </button>

        {/* 3. CHECK OUT */}
        <button 
          onClick={() => setActiveMenu('checkOut')}
          className={`flex-1 text-left px-6 py-3.5 rounded-full transition-colors relative z-10 ${
            activeMenu === 'checkOut' ? 'bg-white shadow-xl' : 'hover:bg-gray-200/50'
          }`}
        >
          <div className="text-[11px] font-extrabold tracking-widest text-gray-900 uppercase">Check out</div>
          <div className={`text-sm font-medium mt-0.5 ${checkOut ? 'text-gray-900' : 'text-gray-500'}`}>
            {checkOut ? new Date(checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Add dates'}
          </div>
        </button>

        {/* 4. GUESTS & SEARCH BUTTON */}
        <div 
          onClick={() => setActiveMenu('guests')}
          className={`flex-1 flex justify-between items-center pl-6 pr-2 py-2 rounded-full transition-colors cursor-pointer relative z-10 ${
            activeMenu === 'guests' ? 'bg-white shadow-xl' : 'hover:bg-gray-200/50'
          }`}
        >
          <div className="text-left">
            <div className="text-[11px] font-extrabold tracking-widest text-gray-900 uppercase">Who</div>
            <div className={`text-sm font-medium mt-0.5 ${totalGuests > 1 ? 'text-gray-900' : 'text-gray-500'}`}>
              {totalGuests > 1 ? `${totalGuests} guests` : 'Add guests'}
            </div>
          </div>
          <button 
            onClick={executeSearch}
            className={`p-4 rounded-full text-white transition-all duration-300 flex items-center justify-center shadow-md ${
              activeMenu ? 'bg-brand-primary hover:bg-brand-hover w-auto px-6 space-x-2' : 'bg-brand-primary hover:bg-brand-hover w-12'
            }`}
          >
            <Search className="w-5 h-5" />
            {activeMenu && <span className="font-semibold text-sm">Search</span>}
          </button>
        </div>

        {/* --- POPOVERS --- */}
        
        {/* Location Popover */}
        {activeMenu === 'location' && (
          <div className="absolute top-full left-0 mt-4 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] w-[400px] p-6 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Popular Destinations</h3>
            <ul className="space-y-2">
              {POPULAR_DESTINATIONS.map(dest => (
                <li 
                  key={dest}
                  onClick={() => handleLocationSelect(dest)}
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="bg-gray-100 p-2.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-gray-900 font-medium">{dest}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Check-in / Check-out Popover (Sleek Native Injector) */}
        {(activeMenu === 'checkIn' || activeMenu === 'checkOut') && (
          <div className={`absolute top-full mt-4 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] w-[350px] p-6 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 ${activeMenu === 'checkIn' ? 'left-[25%]' : 'left-[50%]'}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">
              Select {activeMenu === 'checkIn' ? 'Check-in' : 'Check-out'} Date
            </h3>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input 
                type="date" 
                value={activeMenu === 'checkIn' ? checkIn : checkOut}
                onChange={activeMenu === 'checkIn' ? handleCheckInSelect : handleCheckOutSelect}
                min={activeMenu === 'checkOut' && checkIn ? checkIn : new Date().toISOString().split('T')[0]}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-gray-900 font-medium cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Guests Popover */}
        {activeMenu === 'guests' && (
          <div className="absolute top-full right-0 mt-4 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] w-[380px] p-6 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900 text-base">Adults</div>
                <div className="text-sm text-gray-500">Ages 13 or above</div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => updateGuests('adults', 'subtract')} disabled={guests.adults <= 1} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium text-gray-900 w-4 text-center">{guests.adults}</span>
                <button onClick={() => updateGuests('adults', 'add')} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-semibold text-gray-900 text-base">Children</div>
                <div className="text-sm text-gray-500">Ages 2-12</div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => updateGuests('children', 'subtract')} disabled={guests.children <= 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium text-gray-900 w-4 text-center">{guests.children}</span>
                <button onClick={() => updateGuests('children', 'add')} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 
        =========================================
        MOBILE VIEW: Compact Pill -> Full Modal
        =========================================
      */}
      <div 
        onClick={() => setIsMobileModalOpen(true)}
        className="md:hidden flex items-center bg-white border border-gray-200 rounded-full shadow-card w-full p-2 pl-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <Search className="w-5 h-5 text-gray-800 mr-4" />
        <div className="flex flex-col flex-grow text-left">
          <span className="text-sm font-semibold text-gray-900">{location || 'Where to?'}</span>
          <span className="text-xs text-gray-500 flex items-center space-x-1 font-medium">
            <span>{checkIn ? new Date(checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Anywhere'}</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
            <span>{totalGuests > 1 ? `${totalGuests} guests` : 'Add guests'}</span>
          </span>
        </div>
        <div className="p-2 border border-gray-200 rounded-full ml-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-900" />
        </div>
      </div>

      {/* MOBILE FULL-SCREEN MODAL */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 bg-white z-[100] md:hidden flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <button onClick={() => setIsMobileModalOpen(false)} className="p-2 bg-gray-50 rounded-full border border-gray-200">
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-widest uppercase">Search Rentals</span>
            <button onClick={() => {setLocation(''); setCheckIn(''); setCheckOut('');}} className="text-sm font-semibold underline">Clear</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
            {/* Mobile Location */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Where to?</h2>
              <input 
                type="text" placeholder="Search destinations" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {['Ikoyi', 'Lekki', 'Abuja'].map(dest => (
                  <button key={dest} onClick={() => setLocation(dest)} className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:border-gray-900 transition-colors">
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Dates */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">When's your trip?</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Check in</label>
                  <input type="date" value={checkIn} onChange={handleCheckInSelect} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Check out</label>
                  <input type="date" value={checkOut} onChange={handleCheckOutSelect} min={checkIn} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
            <span className="font-semibold underline cursor-pointer" onClick={() => setIsMobileModalOpen(false)}>Skip</span>
            <button onClick={executeSearch} className="bg-brand-primary text-white font-bold py-3.5 px-8 rounded-xl flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}