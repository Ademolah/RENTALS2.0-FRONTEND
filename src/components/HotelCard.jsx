import React, { useState , useEffect} from 'react';
import { MapPin, Star, Coffee, Wifi, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

// MOCK DATA: To be replaced by your /api/v1/properties?category=HOTEL endpoint
const MOCK_HOTELS = [
  {
    _id: 'h1',
    name: 'The George',
    city: 'Lagos',
    location: 'Ikoyi, Lagos',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    rating: 9.4,
    ratingText: 'Exceptional',
    reviewsCount: 128,
    startingPrice: 185000,
    hasBreakfast: true,
    urgency: 'Only 2 rooms left on our site',
  },
  {
    _id: 'h2',
    name: 'Transcorp Hilton',
    city: 'Abuja',
    location: 'Maitama, Abuja',
    image: 'https://images.unsplash.com/photo-1542314831-c6a4d1409e5c?auto=format&fit=crop&w=1200&q=80',
    rating: 8.8,
    ratingText: 'Fabulous',
    reviewsCount: 342,
    startingPrice: 150000,
    hasBreakfast: true,
    urgency: null,
  },
  {
    _id: 'h3',
    name: 'Lagos Continental',
    city: 'Lagos',
    location: 'Victoria Island, Lagos',
    image: 'https://images.unsplash.com/photo-1551882547-ff40eb0d1556?auto=format&fit=crop&w=1200&q=80',
    rating: 9.0,
    ratingText: 'Superb',
    reviewsCount: 215,
    startingPrice: 120000,
    hasBreakfast: false,
    urgency: 'Booked 4 times in the last 24 hours',
  },
  {
    _id: 'h4',
    name: 'The Envoy',
    city: 'Abuja',
    location: 'Central Business District, Abuja',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    rating: 9.2,
    ratingText: 'Exceptional',
    reviewsCount: 89,
    startingPrice: 195000,
    hasBreakfast: true,
    urgency: 'High demand',
  }
];

// --- 1. THE INDIVIDUAL PREMIUM HOTEL CARD ---
const PremiumHotelCard = ({ hotel }) => {
  return (
    <Link to={`/hotel/${hotel._id}`} className="group block">
      <div className="bg-white border border-gray-200 hover:border-gray-900 transition-colors duration-300 overflow-hidden relative flex flex-col h-full rounded-2xl shadow-sm hover:shadow-xl">
        
        {/* IMAGE CONTAINER */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={hotel.image} 
            alt={hotel.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          />
          
          {/* Booking.com Style Rating Badge */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-white font-bold text-sm drop-shadow-md">{hotel.ratingText}</span>
              <span className="text-white text-[10px] font-medium drop-shadow-md">{hotel.reviewsCount} reviews</span>
            </div>
            <div className="bg-blue-900 text-white font-black text-lg px-2.5 py-1.5 rounded-t-xl rounded-bl-xl rounded-br-sm shadow-lg">
              {hotel.rating.toFixed(1)}
            </div>
          </div>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="p-5 flex flex-col flex-grow justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-brand-primary transition-colors">
                {hotel.name}
              </h3>
            </div>
            
            <div className="flex items-center text-gray-500 text-xs font-medium mb-4">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span className="underline decoration-gray-300 underline-offset-2">{hotel.location}</span>
            </div>

            {/* Badges & Amenities */}
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.hasBreakfast && (
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                  <Coffee className="w-3 h-3 mr-1.5" /> Breakfast Included
                </span>
              )}
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
                <Wifi className="w-3 h-3 mr-1.5" /> Free Wifi
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col">
            {/* Urgency Trigger */}
            <div className="min-h-[20px] mb-2">
              {hotel.urgency && (
                <div className="flex items-center text-[#D32F2F] text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {hotel.urgency}
                </div>
              )}
            </div>
            
            {/* Pricing Section */}
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Starting from</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-gray-900">₦{hotel.startingPrice.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs font-medium">/ night</span>
                </div>
              </div>
              
              <div className="bg-gray-900 text-white p-2.5 rounded-xl group-hover:bg-brand-primary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Link>
  );
};

// --- 2. THE MAIN SECTION LAYOUT (Header, Tabs, Grid) ---
// Ensure useEffect is imported at the top of your file
// import React, { useState, useEffect } from 'react';

// --- 2. THE MAIN SECTION LAYOUT (Header, Tabs, Grid) ---
export default function HotelListingView() {
  const [activeCity, setActiveCity] = useState('Lagos');
  const [msgIndex, setMsgIndex] = useState(0);

  // The rotating messages
  const messages = [
    "Find your next stay",
    "Experience true luxury",
    "Unwind in premium suites"
  ];

  // Rotate the message every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  // Filter hotels based on the active city tab
  const filteredHotels = MOCK_HOTELS.filter(hotel => hotel.city === activeCity);

  return (
    <div className="w-full animate-in fade-in duration-700">
      
      {/* 1. PREMIUM HEADER BANNER - Now perfectly rectangular on mobile */}
      <div className="relative w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl h-36 sm:h-48 md:h-64 flex items-center justify-center">
        
        {/* Deep, rich background with subtle architectural grid overlay */}
        <div className="absolute inset-0 bg-[#0A0A0A]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="relative w-full px-4 flex flex-col items-center justify-center text-center overflow-hidden">
          
          {/* Automated Sliding Text Carousel */}
          <div className="relative h-12 sm:h-16 md:h-24 w-full flex items-center justify-center">
            {messages.map((msg, i) => {
              // Determine position based on active index for smooth leftward sliding
              let positionClass = "opacity-0 translate-x-12"; // Next item (waiting on right)
              if (i === msgIndex) {
                positionClass = "opacity-100 translate-x-0"; // Active item (centered)
              } else if (i === (msgIndex - 1 + messages.length) % messages.length) {
                positionClass = "opacity-0 -translate-x-12"; // Previous item (exiting left)
              }
              
              return (
                <h1
                  key={msg}
                  className={`absolute w-full text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#F25F5C] via-[#FF9B71] to-[#F25F5C] bg-[length:200%_auto] animate-[gradient_4s_linear_infinite] transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${positionClass}`}
                >
                  {msg}
                </h1>
              );
            })}
          </div>

        </div>
      </div>

      {/* 2. THE CITY TOGGLE (Architectural Pill Design) */}
      <div className="flex flex-col items-center mb-10">
        <div className="inline-flex bg-gray-100/80 p-1.5 rounded-full border border-gray-200 backdrop-blur-sm">
          {['Lagos', 'Abuja'].map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                activeCity === city 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              {activeCity === city && (
                <div className="absolute inset-0 bg-gray-900 rounded-full shadow-md" />
              )}
              <span className="relative z-10">{city}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. THE HOTEL GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {filteredHotels.length > 0 ? (
          filteredHotels.map((hotel) => (
            <PremiumHotelCard key={hotel._id} hotel={hotel} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No hotels available</h3>
            <p className="text-gray-500 mt-2">We are currently expanding our exclusive portfolio in {activeCity}.</p>
          </div>
        )}
      </div>

    </div>
  );
}