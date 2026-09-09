import { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import { getProperties } from '../api/properties';
import { Loader2 } from 'lucide-react';

export default function Home({ searchFilters = {}, activeCategory = 'apartment' }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        // Build combined search query parameters
        const queryParams = {
          category: activeCategory,
          ...searchFilters
        };
        const data = await getProperties(queryParams);
        
        // Handle payload response structures gracefully
        const results = Array.isArray(data) ? data : (data.properties || data.data || []);
        setProperties(results);
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [activeCategory, JSON.stringify(searchFilters)]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-2" />
          <p className="text-sm font-medium">Finding available listings...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-lg font-bold text-brand-dark">No properties found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or category selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {properties.map((prop) => (
            <PropertyCard 
              key={prop._id || prop.id} 
              property={{
                id: prop._id || prop.id,
                title: prop.title,
                location: prop.location || `${prop.city || 'Ikoyi'}, ${prop.state || 'Lagos'}`,
                price: prop.pricePerNight || prop.price || 0,
                rating: prop.rating || "5.0",
                dates: "Available Now",
                isRentalVerified: prop.isVerified ?? true,
                isAvailable: prop.isAvailable ?? true,
                image: prop.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
              }} 
            />
          ))}
        </div>
      )}
    </main>
  );
}