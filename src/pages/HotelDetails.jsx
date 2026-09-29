import React, { useState } from 'react';
import { 
  MapPin, Star, Coffee, Wifi, ChevronLeft, ChevronRight, 
  Droplets, Bed, Utensils, Car, CheckCircle2, Wine, 
  CalendarDays, Users, Info
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

// Assuming InteractiveMap is in your components folder
import InteractiveMap from '../components/InteractiveMap';

// --- MOCK DATA FOR UI DEVELOPMENT ---
const MOCK_HOTEL = {
  _id: '6abac87cf34ce1cb12d2c3aa',
  title: 'The Rentals Luxury Hotel',
  description: 'A world-class premium hospitality experience in the heart of the city. Enjoy seamless access to the business district while retreating into a sanctuary of peace and ultimate luxury. Designed for the modern executive and discerning traveler, every detail has been curated to ensure an unforgettable stay.',
  category: 'HOTEL',
  rating: 9.5,
  reviewsCount: 142,
  address: {
    street: '15 Victoria Island Blvd',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    coordinates: { lat: 6.4281, lng: 3.4219 }
  },
  amenities: [
    'Pool', 'Rooftop Lounge', 'Spa', 'Valet Parking', 'Free Wifi', 'Restaurant', 'Gym'
  ],
  images: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542314831-c6a4d1409e5c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40eb0d1556?auto=format&fit=crop&w=1200&q=80'
  ],
  roomTypes: [
    {
      _id: 'r1',
      name: 'Deluxe King Suite',
      pricePerNight: 85000,
      capacity: { adults: 2, children: 0 },
      amenities: ['Ocean View', 'Mini Bar', 'King Bed'],
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'
    },
    {
      _id: 'r2',
      name: 'Executive Penthouse',
      pricePerNight: 250000,
      capacity: { adults: 2, children: 1 },
      amenities: ['Private Pool', 'Butler Service', 'Helipad Access'],
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
    }
  ]
};

// --- DYNAMIC ICON ENGINE ---
const getAmenityIcon = (amenity) => {
  if (!amenity) return CheckCircle2;
  const name = amenity.toLowerCase();
  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('pool') || name.includes('swim')) return Droplets;
  if (name.includes('bed') || name.includes('room') || name.includes('suite')) return Bed;
  if (name.includes('food') || name.includes('restaurant') || name.includes('dining')) return Utensils;
  if (name.includes('bar') || name.includes('lounge')) return Wine;
  if (name.includes('park') || name.includes('valet') || name.includes('garage')) return Car;
  if (name.includes('gym') || name.includes('fitness')) return Users;
  return CheckCircle2; 
};

export default function HotelDetails() {
  const { id } = useParams(); // Will be used when hooked to API
  const hotel = MOCK_HOTEL;

  const [selectedRoom, setSelectedRoom] = useState(hotel.roomTypes[0]._id);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Derive the active room details for the booking summary
  const activeRoomData = hotel.roomTypes.find(r => r._id === selectedRoom);

  const handleBookClick = () => {
    // We will pass selected dates and activeRoomData to the modal later
    setIsBookModalOpen(true);
    console.log("Opening Book Modal for:", activeRoomData.name);
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-32 lg:pb-12">
      
      {/* 1. SCROLLABLE IMAGE GALLERY */}
      <div className="w-full bg-black overflow-hidden relative group">
        <Link to="/hotels" className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-[40vh] md:h-[60vh]">
          {hotel.images.map((img, index) => (
            <div key={index} className="min-w-[85vw] md:min-w-[60vw] lg:min-w-[45vw] h-full snap-center relative p-1">
              <img 
                src={img} 
                alt={`${hotel.title} - view ${index + 1}`} 
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT COLUMN: Hotel Info */}
          <div className="w-full lg:w-2/3 space-y-10">
            
            {/* Header Section */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  {hotel.title}
                </h1>
                <div className="hidden md:flex flex-col items-end ml-4">
                  <div className="bg-blue-900 text-white font-black text-xl px-4 py-2 rounded-xl shadow-lg">
                    {hotel.rating.toFixed(1)}
                  </div>
                  <span className="text-sm font-bold text-gray-500 mt-1">{hotel.reviewsCount} reviews</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 text-sm font-medium mb-6">
                <MapPin className="w-5 h-5 mr-2 text-brand-primary" />
                <span className="text-lg">{hotel.address.street}, {hotel.address.city}, {hotel.address.state}</span>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this property</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {hotel.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Premium Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                {hotel.amenities.map((amenity, idx) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div key={idx} className="flex items-center text-gray-700 font-medium">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Icon className="w-5 h-5 text-gray-900" />
                      </div>
                      {amenity}
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Interactive Map */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-50">
                 <InteractiveMap 
                   address={hotel.address}
                   type="HOTEL"
                 /> 
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Room Selection */}
            <div id="rooms-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h2>
              <div className="space-y-6">
                {hotel.roomTypes.map((room) => {
                  const isSelected = selectedRoom === room._id;
                  return (
                    <div 
                      key={room._id} 
                      onClick={() => setSelectedRoom(room._id)}
                      className={`flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        isSelected ? 'border-brand-primary ring-4 ring-brand-primary/10' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full sm:w-1/3 h-48 sm:h-auto">
                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                            {/* Custom Radio Button */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-primary' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-3 h-3 bg-brand-primary rounded-full" />}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-500 text-sm mt-2 mb-4 space-x-4">
                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {room.capacity.adults} Adults</span>
                            <span className="flex items-center"><Bed className="w-4 h-4 mr-1" /> 1 King Bed</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((am, i) => (
                              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                          <span className="text-2xl font-black text-gray-900">
                            ₦{room.pricePerNight.toLocaleString()} <span className="text-sm font-medium text-gray-500">/ night</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Booking Sidebar (Desktop) */}
          <div className="hidden lg:block w-1/3 relative">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
              
              <div className="mb-6 flex justify-between items-end">
                <span className="text-3xl font-black text-gray-900">
                  ₦{activeRoomData.pricePerNight.toLocaleString()}
                </span>
                <span className="text-gray-500 font-medium mb-1">/ night</span>
              </div>

              {/* Calendar Inputs */}
              <div className="border border-gray-300 rounded-xl overflow-hidden flex flex-col mb-6">
                <div className="flex border-b border-gray-300">
                  <div className="w-1/2 p-3 border-r border-gray-300">
                    <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Check-in</label>
                    <input 
                      type="date" 
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full text-sm font-medium text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                  <div className="w-1/2 p-3">
                    <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Check-out</label>
                    <input 
                      type="date" 
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full text-sm font-medium text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <div className="flex items-start text-sm text-gray-700 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary mr-2 mt-0.5" />
                  <span>Selected: <strong>{activeRoomData.name}</strong></span>
                </div>
                <div className="flex items-start text-sm text-gray-700">
                  <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                  <span>You won't be charged yet.</span>
                </div>
              </div>

              <button 
                onClick={handleBookClick}
                className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-black transition-colors shadow-md hover:shadow-xl active:scale-[0.98]"
              >
                Reserve Now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE BOTTOM BOOKING BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Selected Room</span>
          <span className="text-xl font-black text-gray-900">₦{activeRoomData.pricePerNight.toLocaleString()}<span className="text-sm font-medium text-gray-500">/nt</span></span>
        </div>
        <button 
          onClick={handleBookClick}
          className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-black transition-colors shadow-md active:scale-95"
        >
          Reserve
        </button>
      </div>

      {/* CSS for hiding the scrollbar on the image gallery but keeping functionality */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}