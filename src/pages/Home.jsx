import { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import { getProperties } from '../api/properties';
import { Loader2, Search } from 'lucide-react';

export default function Home({ searchFilters = {}, activeCategory = 'SHORTLET' }) {
  const [properties, setProperties] = useState([]);
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
        // 1. Fetch all properties for the active category (Let the backend do the heavy lifting of pulling the data)
        const responseData = await getProperties({ category: activeCategory });
        
        let results = Array.isArray(responseData) 
          ? responseData 
          : responseData?.data?.properties || responseData?.properties || (Array.isArray(responseData?.data) ? responseData.data : []);

        // 2. SURGICAL FIX: Apply Smart Client-Side Filtering
        if (!isSearchCleared && Object.keys(searchFilters).length > 0) {
          
          // A: Location Matching (Highly Forgiving)
          if (searchFilters.location) {
            const searchStr = searchFilters.location.toLowerCase();
            
            results = results.filter(prop => {
              const city = (prop.address?.city || '').toLowerCase();
              const state = (prop.address?.state || '').toLowerCase();
              const street = (prop.address?.street || '').toLowerCase();
              
              // Checks if the DB city is in the search string (e.g. "lekki" is inside "lekki phase 1, lagos")
              // OR if the search string is in the DB fields.
              return searchStr.includes(city) || city.includes(searchStr) || 
                     searchStr.includes(state) || state.includes(searchStr) ||
                     searchStr.includes(street) || street.includes(searchStr);
            });
          }

          // B: Guest Capacity Logic (Fixes the exact-match bug)
          const requestedGuests = (searchFilters.adults || 0) + (searchFilters.children || 0);
          if (requestedGuests > 0) {
            // Only show properties where maxGuests is GREATER THAN OR EQUAL TO requested guests
            results = results.filter(prop => (prop.maxGuests || 1) >= requestedGuests);
          }
        }
          
        setProperties(results);
      } catch (err) {
        console.error("Failed to load properties:", err);
        setProperties([]); 
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
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No exact matches found</h3>
          <p className="text-gray-500 text-sm mt-2 mb-8 max-w-sm mx-auto leading-relaxed">
            We couldn't find any properties matching your exact search criteria.
          </p>
          
          <button 
            onClick={() => setIsSearchCleared(true)}
            className="px-8 py-3.5 bg-gray-900 text-white rounded-full font-semibold hover:bg-black hover:shadow-lg transition-all active:scale-95"
          >
            Clear Search & Explore
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {properties.map((prop) => (
            <PropertyCard 
              key={prop._id} 
              property={{
                id: prop._id,
                title: prop.title,
                location: `${prop.address?.city}, ${prop.address?.state}`,
                price: prop.pricePerNight,
                rating: prop.rating || "5.0", 
                dates: "Available Now",
                isRentalVerified: prop.isVerified ?? true, 
                isAvailable: prop.isAvailable,
                image: prop.images && prop.images.length > 0 
                  ? prop.images[0] 
                  : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
              }} 
            />
          ))}
        </div>
      )}
    </main>
  );
}