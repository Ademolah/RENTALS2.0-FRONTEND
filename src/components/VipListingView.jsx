import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getVipEstablishments } from '../api/vip';
import { VipSectionHeader } from './VipSectionHeader'; 
import VipCard from './VipCard';
import CitySelectorModal from './CitySelectorModal';

export default function VipListingView({ defaultLocation }) {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track the selected city for filtering
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation || null);

  useEffect(() => {
    async function loadVipData() {
      try {
        const response = await getVipEstablishments();
        setEstablishments(response.data?.establishments || response.data || []);
      } catch (error) {
        console.error("Failed to load VIP listings", error);
      } finally {
        setLoading(false);
      }
    }
    loadVipData();
  }, []);

  // Filter establishments based on the selected city modal
  const filteredEstablishments = useMemo(() => {
    if (!selectedLocation) return establishments;
    
    return establishments.filter(est => {
      const state = (est.address?.state || '').toLowerCase();
      const city = (est.address?.city || '').toLowerCase();
      const target = selectedLocation.toLowerCase();
      
      return state.includes(target) || city.includes(target);
    });
  }, [establishments, selectedLocation]);

  // Intercept the render if no location is chosen yet
  if (!selectedLocation) {
    return (
      <CitySelectorModal 
        onSelect={setSelectedLocation} 
        title="Select VIP Location"
        subtitle="Choose your city to explore exclusive concierge venues."
        buttonText="View VIP Establishments"
      />
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      <VipSectionHeader />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
          <p className="font-medium text-sm uppercase tracking-widest">Loading Concierge...</p>
        </div>
      ) : filteredEstablishments.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
          <p className="text-gray-500 font-bold">No exclusive venues available in {selectedLocation} yet.</p>
          <button 
            onClick={() => setSelectedLocation(null)}
            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition-colors"
          >
            Change Location
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Venues in {selectedLocation}
            </h3>
            <button 
              onClick={() => setSelectedLocation(null)}
              className="text-sm font-bold text-amber-500 hover:text-amber-600 underline underline-offset-4"
            >
              Change City
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredEstablishments.map((establishment) => (
              <VipCard 
                key={establishment._id} 
                establishment={establishment} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}