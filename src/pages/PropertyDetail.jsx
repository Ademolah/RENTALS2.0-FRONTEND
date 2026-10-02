import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Share, Heart, Medal, ArrowLeft, Loader2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import BookingWidget from '../components/BookingWidget';
import InteractiveMap from '../components/InteractiveMap';
import { getPropertyById, getProperties } from "../api/properties"; 

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New State for Similar Properties
  const [similarProperties, setSimilarProperties] = useState([]);

  const mobileScrollRef = useRef(null);
  const desktopScrollRef = useRef(null);
  
  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      ref.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' });
    }
  };

  // 1. MAIN FETCH EFFECT
  useEffect(() => {
    // WORLD CLASS UX: Always snap to the top when navigating to a new property ID
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchDetails() {
      try {
        setLoading(true);
        const response = await getPropertyById(id);
        const dbProp = response?.data?.property || response?.property || response;
        
        setProperty({
          id: dbProp._id,
          title: dbProp.title,
          location: `${dbProp.address?.street}, ${dbProp.address?.city}`,
          address: dbProp.address,
          price: dbProp.pricePerNight,
          description: dbProp.description,
          maxGuests: dbProp.maxGuests,
          category: dbProp.category,
          amenities: dbProp.amenities || [],
          images: dbProp.images?.length > 0 
            ? dbProp.images 
            : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
          isRentalVerified: dbProp.isVerified ?? true,
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

  
  useEffect(() => {
    async function fetchSimilar() {
      if (!property?.address?.city) return;
      try {
        const res = await getProperties(); 
        const allProps = res?.data?.properties || res?.properties || res?.data || [];
        
        // Filter: Same city, NOT the current property, and NOT a hotel!
        const similar = allProps.filter(p => 
          p._id !== property.id && 
          p.address?.city === property.address?.city &&
          p.category !== 'HOTEL' // <-- The surgical fix to block hotels
        ).slice(0, 4); 
        
        setSimilarProperties(similar);
      } catch (err) {
        console.error("Failed to load similar properties", err);
      }
    }
    
    if (property) fetchSimilar();
  }, [property]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="text-gray-500 font-medium">Preparing property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 text-gray-500 font-bold">
        Property not found or is no longer available.
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      
      {/* Back to listings button */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-all group w-fit">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to listings</span>
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            {property.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-900 font-bold">
            <span className="underline cursor-pointer flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {property.location}</span>
            {property.isRentalVerified && (
              <span className="flex items-center space-x-1 text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-lg">
                <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded text-[10px] font-black">R</span>
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 text-sm font-bold">
          <button className="flex items-center space-x-2 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Share className="w-4 h-4" /> <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Heart className="w-4 h-4" /> <span>Save</span>
          </button>
        </div>
      </div>

      {/* The Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* LEFT COLUMN: Scrollable Content */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Main Image Gallery */}
          <div className="mb-4">
            
            {/* MOBILE VIEW */}
            <div className="md:hidden relative h-[350px] w-full rounded-2xl overflow-hidden group shadow-sm">
              <div ref={mobileScrollRef} className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {property.images.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                    <img src={img} alt={`${property.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 right-4 bg-gray-900/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {idx + 1} / {property.images.length}
                    </div>
                  </div>
                ))}
              </div>

              {property.images.length > 1 && (
                <>
                  <button onClick={() => scrollGallery(mobileScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => scrollGallery(mobileScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-90"><ChevronRight className="w-5 h-5" /></button>
                </>
              )}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block h-[500px] rounded-2xl overflow-hidden shadow-sm">
              {property.images.length === 1 && (
                <div className="w-full h-full relative">
                  <img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300 rounded-2xl" alt="Main View" />
                </div>
              )}
              {property.images.length === 2 && (
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div className="w-full h-full relative"><img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="View 1"/></div>
                  <div className="w-full h-full relative"><img src={property.images[1]} className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="View 2"/></div>
                </div>
              )}
              {property.images.length >= 3 && (
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div className="w-full h-full relative group">
                    <img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover cursor-pointer group-hover:opacity-95 transition-opacity duration-300" alt="Main View" />
                  </div>
                  <div className="grid grid-rows-2 gap-2 h-full">
                    <div className="w-full h-full relative group">
                      <img src={property.images[1]} className="absolute inset-0 w-full h-full object-cover cursor-pointer group-hover:opacity-95 transition-opacity duration-300" alt="Interior 1" />
                    </div>
                    <div className="w-full h-full relative group">
                      <div ref={desktopScrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {property.images.slice(2).map((img, idx) => (
                          <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                            <img src={img} className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300" alt={`Interior ${idx + 2}`} />
                            {property.images.length > 3 && (
                              <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full pointer-events-none shadow-lg">
                                {idx + 1} / {property.images.length - 2}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {property.images.length > 3 && (
                        <>
                          <button onClick={() => scrollGallery(desktopScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => scrollGallery(desktopScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"><ChevronRight className="w-5 h-5" /></button>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Entire apartment hosted by Rentals</h2>
            <div className="flex space-x-4 text-gray-600 font-medium mb-6">
              <span>{property.maxGuests || 2} guests</span>
              <span>·</span>
              <span>1 bedroom</span>
              <span>·</span>
              <span>1 bed</span>
              <span>·</span>
              <span>1 bath</span>
            </div>
            
            <div className="flex items-start space-x-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <Medal className="w-6 h-6 text-brand-primary shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900">Superhost status</h3>
                <p className="text-gray-500 text-sm mt-1">Superhosts are experienced, highly rated hosts committed to providing great stays.</p>
              </div>
            </div>

             
          {property.description && (
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">About this space</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}
            
          </div>

          {/* Mobile Booking Widget - Hidden on Desktop */}
          <div className="lg:hidden block">
            <BookingWidget property={property} />
          </div>

          {/* Interactive Map Section */}
          <div className="pt-4 pb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Where you'll be</h3>
            <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
              <InteractiveMap 
                address={property.address} 
                type="SHORTLET"
                price={property.pricePerNight}
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Booking Widget Only */}
        <div className="hidden lg:block lg:col-span-5 relative">
          <div className="sticky top-28 w-full max-w-md ml-auto">
            <BookingWidget property={property} />
          </div>
        </div>

      </div>

      {/* --- SIMILAR PROPERTIES SECTION --- */}
      {similarProperties.length > 0 && (
        <div className="mt-12 pt-16 border-t border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">More places to stay</h3>
              <p className="text-gray-500 font-medium mt-1">Similar premium shortlets in {property.address?.city}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProperties.map((simProp) => (
              <Link 
                key={simProp._id} 
                to={`/property/${simProp._id}`}
                className="group flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-200 mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                  <img 
                    src={simProp.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'} 
                    alt={simProp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                    {simProp.address?.city}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 text-base truncate mb-1 group-hover:text-brand-primary transition-colors">{simProp.title}</h4>
                  <p className="text-sm text-gray-500 mb-2 truncate">{simProp.address?.street}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="font-extrabold text-gray-900 text-lg">₦{(simProp.pricePerNight || simProp.price || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-500 font-medium">/ night</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}