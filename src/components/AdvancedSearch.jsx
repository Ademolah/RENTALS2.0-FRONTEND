import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, MapPin, Plus, Minus, X, ChevronLeft, ChevronRight } from 'lucide-react';

const LOCATION_TAXONOMY = {
  "Lagos": [
    "Ikoyi", "Banana Island", "Victoria Island", "Lekki Phase 1", 
    "Ikeja GRA", "Yaba", "Surulere", "Ajah", "Magodo"
  ],
  "Abuja": [
    "Asokoro", "Maitama", "Wuse 2", "Garki", 
    "Central Business District", "Jabi", "Gwarinpa", "Apo"
  ]
};

// Helper to normalize dates for accurate comparison
const stripTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function AdvancedSearch({ onSearch, activeCityContext }) {
  const [activeMenu, setActiveMenu] = useState(null); 
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const searchBarRef = useRef(null);

  // Custom Calendar State
  const today = stripTime(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableDestinations = activeCityContext && LOCATION_TAXONOMY[activeCityContext]
    ? LOCATION_TAXONOMY[activeCityContext]
    : [...LOCATION_TAXONOMY["Lagos"].slice(0, 3), ...LOCATION_TAXONOMY["Abuja"].slice(0, 3)];

  const displayedDestinations = availableDestinations.filter(dest => 
    dest.toLowerCase().includes(location.toLowerCase())
  );

  const handleLocationSelect = (dest) => {
    setLocation(dest);
    setActiveMenu('checkIn'); 
  };

  // --- LUXURY CALENDAR LOGIC ---
  const handleDayClick = (date) => {
    const selectedTime = date.getTime();
    const checkInTime = checkIn ? new Date(checkIn).getTime() : null;

    if (activeMenu === 'checkIn') {
      setCheckIn(date.toISOString().split('T')[0]);
      if (checkOut && selectedTime >= new Date(checkOut).getTime()) {
        setCheckOut(''); // Clear checkout if check-in is set after it
      }
      setActiveMenu('checkOut');
    } else if (activeMenu === 'checkOut') {
      if (checkInTime && selectedTime <= checkInTime) {
        // If they click a date before check-in, auto-assign it to check-in instead
        setCheckIn(date.toISOString().split('T')[0]);
        setCheckOut('');
        setActiveMenu('checkOut');
      } else {
        setCheckOut(date.toISOString().split('T')[0]);
        setActiveMenu('guests');
      }
    }
  };

  const renderMonth = (monthOffset, isMobile = false) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = date.toLocaleString('default', { month: 'long' });

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(stripTime(new Date(year, month, i)));

    return (
      <div className={`flex-1 ${isMobile ? 'w-full' : 'min-w-[280px]'}`}>
        <div className="flex justify-between items-center mb-6 px-2">
          {monthOffset === 0 ? (
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={date <= new Date(today.getFullYear(), today.getMonth(), 1)}>
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : <div className="w-9"></div>}
          
          <h3 className="text-base font-bold text-gray-900 tracking-tight">{monthName} {year}</h3>
          
          {monthOffset === (isMobile ? 0 : 1) ? (
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          ) : <div className="w-9"></div>}
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            
            const isPast = day < today;
            const isCheckIn = checkIn && day.getTime() === stripTime(new Date(checkIn)).getTime();
            const isCheckOut = checkOut && day.getTime() === stripTime(new Date(checkOut)).getTime();
            
            // Seamless Range Highlighting
            const inRange = checkIn && checkOut && day > new Date(checkIn) && day < new Date(checkOut);
            const inHoverRange = activeMenu === 'checkOut' && checkIn && !checkOut && hoveredDate && day > new Date(checkIn) && day <= hoveredDate;

            let bgClass = "bg-white hover:border-gray-900 border-transparent border";
            let textClass = "text-gray-900";
            let wrapperClass = "relative w-full aspect-square flex items-center justify-center p-0.5";

            if (isPast) {
              bgClass = "bg-transparent cursor-not-allowed";
              textClass = "text-gray-300 line-through decoration-gray-200";
            } else if (isCheckIn || isCheckOut) {
              bgClass = "bg-brand-primary border-brand-primary shadow-md";
              textClass = "text-white font-bold";
              if (isCheckIn && (checkOut || inHoverRange)) wrapperClass += " bg-brand-primary/10 rounded-l-full";
              if (isCheckOut) wrapperClass += " bg-brand-primary/10 rounded-r-full";
            } else if (inRange || inHoverRange) {
              wrapperClass = "relative w-full aspect-square flex items-center justify-center bg-brand-primary/10";
              bgClass = "bg-transparent border-transparent";
            }

            return (
              <div key={idx} className={wrapperClass}>
                <button
                  onClick={() => !isPast && handleDayClick(day)}
                  onMouseEnter={() => !isPast && setHoveredDate(day)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={isPast}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${bgClass} ${textClass}`}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
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
    if (e) e.stopPropagation();
    setActiveMenu(null);
    setIsMobileModalOpen(false);
    
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
  const activeMenuIsDate = activeMenu === 'checkIn' || activeMenu === 'checkOut';

  return (
    <div className="w-full flex justify-center mt-4 md:mt-8 px-4 z-40 relative" ref={searchBarRef}>
      
      {/* DESKTOP VIEW */}
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
            placeholder="Search neighborhoods" 
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

        {/* 4. GUESTS & SEARCH */}
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
        
        {activeMenu === 'location' && (
          <div className="absolute top-full left-0 mt-4 bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] w-[400px] p-6 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {activeCityContext ? `Explore ${activeCityContext}` : 'Popular Destinations'}
            </h3>
            {displayedDestinations.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">No matching neighborhoods found.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {displayedDestinations.map(dest => (
                  <li 
                    key={dest} onClick={() => handleLocationSelect(dest)}
                    className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group"
                  >
                    <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-brand-primary/10 transition-all">
                      <MapPin className="w-5 h-5 text-gray-600 group-hover:text-brand-primary transition-colors" />
                    </div>
                    <span className="text-gray-900 font-medium">{dest}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* LUXURY DUAL-PANE CALENDAR POPOVER */}
        {activeMenuIsDate && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-max p-8 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            
            {/* Dynamic Header Tab */}
            <div className="flex items-center justify-center space-x-8 mb-6 pb-6 border-b border-gray-100">
              <button 
                onClick={() => setActiveMenu('checkIn')}
                className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeMenu === 'checkIn' ? 'border-brand-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Select Check-in
              </button>
              <button 
                onClick={() => setActiveMenu('checkOut')}
                className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeMenu === 'checkOut' ? 'border-brand-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Select Check-out
              </button>
            </div>

            <div className="flex space-x-12">
              {renderMonth(0, false)}
              {renderMonth(1, false)}
            </div>
          </div>
        )}

        {/* Guests Popover */}
        {activeMenu === 'guests' && (
          <div className="absolute top-full right-0 mt-4 bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-[380px] p-8 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between py-5 border-b border-gray-100">
              <div>
                <div className="font-bold text-gray-900 text-base">Adults</div>
                <div className="text-sm text-gray-500 font-medium mt-1">Ages 13 or above</div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => updateGuests('adults', 'subtract')} disabled={guests.adults <= 1} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-brand-primary hover:text-brand-primary disabled:opacity-30 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-900 w-4 text-center">{guests.adults}</span>
                <button onClick={() => updateGuests('adults', 'add')} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-5">
              <div>
                <div className="font-bold text-gray-900 text-base">Children</div>
                <div className="text-sm text-gray-500 font-medium mt-1">Ages 2-12</div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => updateGuests('children', 'subtract')} disabled={guests.children <= 0} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-brand-primary hover:text-brand-primary disabled:opacity-30 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-900 w-4 text-center">{guests.children}</span>
                <button onClick={() => updateGuests('children', 'add')} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE VIEW */}
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

      {/* MOBILE MODAL */}
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
            {/* Context Aware Location */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">
                {activeCityContext ? `Explore ${activeCityContext}` : 'Where to?'}
              </h2>
              <input 
                type="text" placeholder="Search neighborhoods" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              />
              <div className="mt-4 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {displayedDestinations.map(dest => (
                  <button key={dest} onClick={() => setLocation(dest)} className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors">
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Single-Pane Luxury Calendar */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6">When's your trip?</h2>
              
              <div className="flex items-center justify-center space-x-4 mb-6">
                 <button onClick={() => setActiveMenu('checkIn')} className={`text-sm font-bold pb-1 border-b-2 transition-colors ${!checkIn || activeMenu !== 'checkOut' ? 'border-brand-primary text-gray-900' : 'border-transparent text-gray-400'}`}>Check-in</button>
                 <button onClick={() => setActiveMenu('checkOut')} className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeMenu === 'checkOut' ? 'border-brand-primary text-gray-900' : 'border-transparent text-gray-400'}`}>Check-out</button>
              </div>

              {renderMonth(0, true)}
              
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
            <span className="font-semibold underline cursor-pointer" onClick={() => setIsMobileModalOpen(false)}>Skip</span>
            <button onClick={executeSearch} className="bg-brand-primary hover:opacity-90 transition-opacity text-white font-bold py-3.5 px-8 rounded-xl flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}