import { useState, useEffect, useMemo } from 'react';
import { Loader2, Building, ShieldCheck } from 'lucide-react';
import { getVipEstablishments, getVipServices } from '../api/vip';
import { VipSectionHeader } from './VipSectionHeader'; 
import VipCard from './VipCard';
import CitySelectorModal from './CitySelectorModal';

export default function VipListingView({ defaultLocation }) {
  const [establishments, setEstablishments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('venues'); // 'venues' | 'services'
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation || null);

  useEffect(() => {
    async function loadVipData() {
      try {
        setLoading(true);
        // 💡 NEW: Fetch both concurrently. allSettled ensures one failure doesn't break the whole page.
        const [venuesRes, servicesRes] = await Promise.allSettled([
          getVipEstablishments(),
          getVipServices()
        ]);

        if (venuesRes.status === 'fulfilled') {
          setEstablishments(venuesRes.value.data?.establishments || venuesRes.value.data || []);
        }
        if (servicesRes.status === 'fulfilled') {
          setServices(servicesRes.value.data?.services || servicesRes.value.data || []);
        }
      } catch (error) {
        console.error("Failed to load VIP data", error);
      } finally {
        setLoading(false);
      }
    }
    loadVipData();
  }, []);

  // Helper to filter by city
  const filterByLocation = (items, targetCity) => {
    if (!targetCity) return items;
    const target = targetCity.toLowerCase();
    return items.filter(item => {
      const state = (item.address?.state || '').toLowerCase();
      const city = (item.address?.city || '').toLowerCase();
      return state.includes(target) || city.includes(target);
    });
  };

  const filteredEstablishments = useMemo(() => filterByLocation(establishments, selectedLocation), [establishments, selectedLocation]);
  const filteredServices = useMemo(() => filterByLocation(services, selectedLocation), [services, selectedLocation]);

  // Determine which list to show based on the active tab
  const activeList = activeTab === 'venues' ? filteredEstablishments : filteredServices;

  if (!selectedLocation) {
    return (
      <CitySelectorModal 
        onSelect={setSelectedLocation} 
        title="Select VIP Location"
        subtitle="Choose your city to explore exclusive concierge venues and services."
        buttonText="View VIP Directory"
      />
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      <VipSectionHeader />

      {/* 💡 NEW: Premium Segmented Control Tabs */}
      <div className="flex justify-center mb-10">
        <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex space-x-1 shadow-inner border border-gray-200">
          <button
            onClick={() => setActiveTab('venues')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-display font-bold tracking-widest uppercase transition-all duration-300 ${
              activeTab === 'venues' 
                ? 'bg-black text-amber-400 shadow-md' 
                : 'text-brand-text-secondary hover:text-brand-dark'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>VIP Venues</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-display font-bold tracking-widest uppercase transition-all duration-300 ${
              activeTab === 'services' 
                ? 'bg-black text-amber-400 shadow-md' 
                : 'text-brand-text-secondary hover:text-brand-dark'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>VIP Services</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
          <p className="font-medium text-sm uppercase tracking-widest">Curating Portfolio...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
          <p className="text-brand-text-secondary font-bold">No exclusive {activeTab} available in {selectedLocation} yet.</p>
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
            <h3 className="text-xl font-bold text-brand-dark tracking-tight capitalize">
              {activeTab} in {selectedLocation}
            </h3>
            <button 
              onClick={() => setSelectedLocation(null)}
              className="text-sm font-bold text-amber-500 hover:text-amber-600 underline underline-offset-4"
            >
              Change City
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {activeList.map((item) => (
              <VipCard 
                key={item._id} 
                establishment={item} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}