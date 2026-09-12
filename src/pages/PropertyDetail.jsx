import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Share, Heart, Medal, ArrowLeft } from 'lucide-react';
import BookingWidget from '../components/BookingWidget';
import InteractiveMap from '../components/InteractiveMap';
import {getPropertyById} from "../api/properties"
import { Loader2, ChevronLeft, ChevronRight, } from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();

  // Temporary mock data reflecting the selected property ID
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const mobileScrollRef = useRef(null);
  const desktopScrollRef = useRef(null);
  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      ref.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const response = await getPropertyById(id);
        
        // Safely extract the property from your backend's JSON structure
        const dbProp = response?.data?.property || response?.property || response;
        
        // 3. Map Mongoose fields to your UI's expected format
        // Inside PropertyDetail.jsx useEffect...
        setProperty({
          id: dbProp._id,
          title: dbProp.title,
          location: `${dbProp.address?.street}, ${dbProp.address?.city}`,
          price: dbProp.pricePerNight,
          description: dbProp.description,
          maxGuests: dbProp.maxGuests,
          category: dbProp.category,
          amenities: dbProp.amenities || [],
          images: dbProp.images?.length > 0 
            ? dbProp.images 
            : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
          isRentalVerified: dbProp.isVerified ?? true,
          
          // SURGICAL FIX: Map the availability fields so the widget knows!
          isAvailable: dbProp.isAvailable,
          nextAvailableDate: dbProp.nextAvailableDate
        });
      } catch (error) {
        console.error("Failed to load property:", error);
        } finally {
        setLoading(false);
      }
    }
    if (id) fetchDetails();
  }, [id]);

  // 4. Elegant loading state matching your premium UI
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="text-gray-500 font-medium">Preparing property details...</p>
      </div>
    );
  }

  // 5. Fallback if property ID is invalid
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 text-gray-500">
        Property not found or is no longer available.
      </div>
    );
  }

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
          
          {/* Main Image Gallery */}
<div className="mb-8">
  
  {/* MOBILE VIEW: Full swipeable carousel (Hidden on md and up) */}
  <div className="md:hidden relative h-[350px] w-full rounded-2xl overflow-hidden group">
    
    <div 
      ref={mobileScrollRef}
      className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {property.images.map((img, idx) => (
        <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
          <img 
            src={img} 
            alt={`${property.title} - ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Subtle counter */}
          <div className="absolute bottom-4 right-4 bg-gray-900/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {idx + 1} / {property.images.length}
          </div>
        </div>
      ))}
    </div>

    {/* Mobile Chevrons (Only show if > 1 image) */}
    {property.images.length > 1 && (
      <>
        <button 
          onClick={() => scrollGallery(mobileScrollRef, 'left')} 
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => scrollGallery(mobileScrollRef, 'right')} 
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </>
    )}
  </div>

  {/* DESKTOP VIEW: Adaptive Premium Grid Layout (Hidden on mobile) */}
  <div className="hidden md:block h-[500px] rounded-2xl overflow-hidden">
    
    {/* CONDITION A: Exactly 1 Image */}
    {property.images.length === 1 && (
      <div className="w-full h-full relative">
        <img 
          src={property.images[0]} 
          className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300 rounded-2xl"
          alt="Main View"
        />
      </div>
    )}

    {/* CONDITION B: Exactly 2 Images (50/50 Split) */}
    {property.images.length === 2 && (
      <div className="grid grid-cols-2 gap-2 h-full">
        <div className="w-full h-full relative">
          <img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="View 1"/>
        </div>
        <div className="w-full h-full relative">
          <img src={property.images[1]} className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="View 2"/>
        </div>
      </div>
    )}

    {/* CONDITION C: 3 or More Images */}
    {property.images.length >= 3 && (
      <div className="grid grid-cols-2 gap-2 h-full">
        
        {/* Left Side: Main Hero Image */}
        <div className="w-full h-full relative group">
          <img 
            src={property.images[0]} 
            className="absolute inset-0 w-full h-full object-cover cursor-pointer group-hover:opacity-95 transition-opacity duration-300"
            alt="Main View"
          />
        </div>

        {/* Right Side: Split Stack */}
        <div className="grid grid-rows-2 gap-2 h-full">
          
          {/* Top Right */}
          <div className="w-full h-full relative group">
            <img 
              src={property.images[1]} 
              className="absolute inset-0 w-full h-full object-cover cursor-pointer group-hover:opacity-95 transition-opacity duration-300"
              alt="Interior 1"
            />
          </div>
          
          {/* Bottom Right: Scrollable Strip for remaining images */}
          <div className="w-full h-full relative group">
            
            {/* SURGICAL FIX: Added absolute inset-0 to prevent flexbox height collapse */}
            <div 
              ref={desktopScrollRef}
              className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {property.images.slice(2).map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                  <img 
                    src={img} 
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    alt={`Interior ${idx + 2}`}
                  />
                  {/* Total counter overlay (Only show if > 3 images total) */}
                  {property.images.length > 3 && (
                    <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full pointer-events-none shadow-lg">
                      {idx + 1} / {property.images.length - 2}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Chevrons (Only appear on hover if there are > 3 total images) */}
            {property.images.length > 3 && (
              <>
                <button 
                  onClick={() => scrollGallery(desktopScrollRef, 'left')} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollGallery(desktopScrollRef, 'right')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
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
          <BookingWidget property={property} />

        </div>

        {/* RIGHT COLUMN: Sticky Map & Booking Widget */}
        <div className="lg:col-span-5 h-[600px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-28 flex flex-col gap-6">
          <div className="hidden lg:block w-full max-w-md ml-auto">
            <BookingWidget property={property} />
          </div>
          
          <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-card">
            <InteractiveMap />
          </div>
        </div>

      </div>
    </main>
  );
}