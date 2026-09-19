import { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import CarCard from '../components/CarCard'; // Import the Car Card
import { getProperties } from '../api/properties';
import { getCars } from '../api/car'; // Import the Car API
import { Loader2, Search } from 'lucide-react';

export default function Home({ searchFilters = {}, activeCategory = 'SHORTLET' }) {
  // Renamed state to 'listings' to semantically accommodate both properties and cars
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchCleared, setIsSearchCleared] = useState(false);

  useEffect(() => {
    if (Object.keys(searchFilters).length > 0) {
      setIsSearchCleared(false);
    }
  }, [searchFilters]);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        let responseData;
        const normalizedCategory = activeCategory.toLowerCase();
        
        // 1. Dual-Engine Fetch: Route to the correct backend API
        // 1. Dual-Engine Fetch: Route to the correct backend API
        if (normalizedCategory === 'car') {
          // Fetch ALL cars. Do not filter by category='car' because car categories 
          // are things like 'SUV' or 'Sedan' in the DB.
          responseData = await getCars(); 
        
        } else {
          // Handles shortlet, hotel, and vip reservations
          responseData = await getProperties({ category: activeCategory });
        }
        
        let results = Array.isArray(responseData) 
          ? responseData 
          : responseData?.data?.properties || responseData?.data?.cars || responseData?.properties || responseData?.cars || (Array.isArray(responseData?.data) ? responseData.data : []);

          console.log("[DEBUG FRONTEND 2]: Extracted Results array. Length:", results.length, "Booked inside?", results.some(r => r.isAvailable === false));

        // 2. SURGICAL FIX: Apply Smart Client-Side Filtering
        if (!isSearchCleared && Object.keys(searchFilters).length > 0) {
          
          // A: Location Matching (Highly Forgiving - works for both Properties and Cars)
          if (searchFilters.location) {
            const searchStr = searchFilters.location.toLowerCase();
            
            results = results.filter(item => {
              // Cars use item.location, Properties use item.address
              const city = (item.address?.city || item.location?.city || '').toLowerCase();
              const state = (item.address?.state || item.location?.state || '').toLowerCase();
              const street = (item.address?.street || '').toLowerCase();
              
              return searchStr.includes(city) || city.includes(searchStr) || 
                     searchStr.includes(state) || state.includes(searchStr) ||
                     searchStr.includes(street) || street.includes(searchStr);
            });
          }

          // B: Guest Capacity Logic (Only apply if we are looking at properties)
          if (normalizedCategory !== 'car') {
            const requestedGuests = (searchFilters.adults || 0) + (searchFilters.children || 0);
            if (requestedGuests > 0) {
              results = results.filter(prop => (prop.maxGuests || 1) >= requestedGuests);
            }
          }
        }
          
        setListings(results);
      } catch (err) {
        console.error("Failed to load listings:", err);
        setListings([]); 
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [activeCategory, JSON.stringify(searchFilters), isSearchCleared]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-2" />
          <p className="text-sm font-medium">Finding available listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No exact matches found</h3>
          <p className="text-gray-500 text-sm mt-2 mb-8 max-w-sm mx-auto leading-relaxed">
            We couldn't find any listings matching your exact search criteria.
          </p>
          
          <button 
            onClick={() => setIsSearchCleared(true)}
            className="px-8 py-3.5 bg-gray-900 text-white rounded-full font-semibold hover:bg-black hover:shadow-lg transition-all active:scale-95"
          >
            Clear Search & Explore
          </button>
        </div>
      ) : (
        <>
          {/* DYNAMIC CATEGORY HEADERS */}
          {activeCategory.toLowerCase() === 'car' && (
            <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-600 mb-4 tracking-tight">
                Save More, Travel More.
              </h2>
              <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
                Get affordable, premium car rentals for your trips and city tours.
              </p>
            </div>
          )}

          {/* LISTINGS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
            {listings.map((item) => (
              // Dynamically render CarCard vs PropertyCard based on active category
              activeCategory.toLowerCase() === 'car' ? (
                <CarCard key={item._id} car={item} />
              ) : (
                <PropertyCard 
                  key={item._id} 
                  property={{
                    id: item._id,
                    title: item.title,
                    location: `${item.address?.city}, ${item.address?.state}`,
                    price: Number(item.pricePerNight || item.price || 0), // SURGICAL FIX
                    rating: item.rating || "5.0", 
                    dates: "Available Now",
                    isRentalVerified: item.isVerified ?? true, 
                    isAvailable: item.isAvailable,
                    image: item.images && item.images.length > 0 
                      ? item.images[0] 
                      : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
                  }} 
                />
              )
            ))}
          </div>
        </>
      )}
    </main>
  );
}