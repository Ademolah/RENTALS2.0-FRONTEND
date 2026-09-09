import { useParams, Link } from 'react-router-dom';
import { Share, Heart, Medal, ArrowLeft } from 'lucide-react';
import BookingWidget from '../components/BookingWidget';
import InteractiveMap from '../components/InteractiveMap';

export default function PropertyDetail() {
  const { id } = useParams();

  // Temporary mock data reflecting the selected property ID
  const property = {
    id,
    title: `Minimalist Luxury Suite (Property ${id})`,
    location: "Ikoyi, Lagos",
    price: 150000,
    isRentalVerified: true
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Back to listings button */}
      <Link to="/" className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-brand-dark mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">
            {property.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-brand-dark font-medium">
            <span className="underline cursor-pointer">{property.location}</span>
            {property.isRentalVerified && (
              <span className="flex items-center space-x-1 text-brand-primary">
                <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded text-[10px] font-bold">R</span>
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-4 text-sm font-medium underline">
          <button className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
            <Share className="w-4 h-4" /> <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
            <Heart className="w-4 h-4" /> <span>Save</span>
          </button>
        </div>
      </div>

      {/* The Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* LEFT COLUMN: Scrollable Content */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Main Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80" 
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              alt="Main"
            />
            <div className="hidden md:grid grid-rows-2 gap-2">
              <img 
                src="https://images.unsplash.com/photo-1502672260266-1c1de24244ec?auto=format&fit=crop&w=800&q=80" 
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                alt="Interior"
              />
              <img 
                src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80" 
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                alt="Kitchen"
              />
            </div>
          </div>

          {/* Property Details */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Entire apartment hosted by Rentals</h2>
            <div className="flex space-x-4 text-brand-dark mb-6">
              <span>2 guests</span>
              <span>·</span>
              <span>1 bedroom</span>
              <span>·</span>
              <span>1 bed</span>
              <span>·</span>
              <span>1 bath</span>
            </div>
            
            <div className="flex items-start space-x-4">
              <Medal className="w-8 h-8 text-brand-dark" />
              <div>
                <h3 className="font-semibold text-brand-dark">Superhost status</h3>
                <p className="text-gray-500 text-sm">Superhosts are experienced, highly rated hosts.</p>
              </div>
            </div>
          </div>

          {/* Mobile Booking Widget */}
          <div className="block lg:hidden">
            <BookingWidget price={property.price} />
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Map & Booking Widget */}
        <div className="lg:col-span-5 h-[600px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-28 flex flex-col gap-6">
          <div className="hidden lg:block w-full max-w-md ml-auto">
            <BookingWidget price={property.price} />
          </div>
          
          <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-card">
            <InteractiveMap />
          </div>
        </div>

      </div>
    </main>
  );
}