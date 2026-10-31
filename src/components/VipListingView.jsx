import { useState, useEffect, useMemo, useCallback } from 'react';
import { Building, ShieldCheck } from 'lucide-react';
import { getVipEstablishments, getVipServices } from '../api/vip';
import { VipSectionHeader } from './VipSectionHeader'; 
import VipCard from './VipCard';
import CitySelectorModal from './CitySelectorModal';
import BrowseShell from './browse/BrowseShell';
import { SkeletonGrid, ErrorState, NoResults } from './browse/States';
import { applyFilters, sortItems } from './browse/meta';

export default function VipListingView({ defaultLocation, query }) {
  const [establishments, setEstablishments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('recommended');
  
  const [activeTab, setActiveTab] = useState('venues'); // 'venues' | 'services'
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation || null);

  const fetchVipData = useCallback(
    () => Promise.allSettled([getVipEstablishments(), getVipServices()])
      .then(([venuesRes, servicesRes]) => {
        if (venuesRes.status === 'rejected' && servicesRes.status === 'rejected') setError(true);
        if (venuesRes.status === 'fulfilled') {
          setEstablishments(venuesRes.value.data?.establishments || venuesRes.value.data || []);
        }
        if (servicesRes.status === 'fulfilled') {
          setServices(servicesRes.value.data?.services || servicesRes.value.data || []);
        }
      })
      .catch((e) => {
        console.error('Failed to load VIP data', e);
        setError(true);
      })
      .finally(() => setLoading(false)),
    []
  );

  const loadVipData = useCallback(() => {
    setLoading(true);
    setError(false);
    return fetchVipData();
  }, [fetchVipData]);

  useEffect(() => { fetchVipData(); }, [fetchVipData]);

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
  const baseList = activeTab === 'venues' ? filteredEstablishments : filteredServices;
  const typeOptions = useMemo(() => {
    const set = new Set(baseList.map((i) => String(i.establishmentType || i.serviceType || '').toUpperCase()).filter(Boolean));
    return [...set].map((v) => ({ value: v, label: v.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase()) }));
  }, [baseList]);
  const vipConfig = [
    { kind: 'price', label: activeTab === 'venues' ? 'Required deposit' : 'Price per day', max: 2000000, step: 25000 },
    ...(typeOptions.length ? [{ kind: 'multi', key: 'types', label: 'Type', options: typeOptions }] : []),
  ];
  const activeList = useMemo(() => sortItems(applyFilters(baseList, { ...filters, query }), sort), [baseList, filters, sort, query]);
  const hasFilters = Object.keys(filters).length > 0;

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
            className={`flex items-center space-x-2 px-7 py-3.5 rounded-xl text-base font-display font-bold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'venues'
                ? 'bg-brand-dark text-amber-400 shadow-md'
                : 'text-brand-text-secondary hover:text-brand-dark'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>VIP Venues</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 px-7 py-3.5 rounded-xl text-base font-display font-bold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'services'
                ? 'bg-brand-dark text-amber-400 shadow-md'
                : 'text-brand-text-secondary hover:text-brand-dark'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>VIP Services</span>
          </button>
        </div>
      </div>

      <BrowseShell
        config={vipConfig}
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        total={activeList.length}
        noun={activeTab === 'venues' ? 'venues' : 'services'}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl md:text-[28px] font-display font-bold text-brand-dark tracking-tight capitalize">
            {activeTab} in {selectedLocation}
          </h3>
          <button
            onClick={() => setSelectedLocation(null)}
            className="text-base font-bold text-brand-primary hover:text-brand-hover underline underline-offset-4"
          >
            Change City
          </button>
        </div>

        {loading ? (
          <SkeletonGrid count={6} className="xl:grid-cols-3" />
        ) : error ? (
          <ErrorState onRetry={loadVipData} message="We couldn't load VIP listings. Check your connection and try again." />
        ) : activeList.length === 0 ? (
          <NoResults
            hasFilters={hasFilters}
            onClear={() => setFilters({})}
            text={hasFilters ? undefined : `No exclusive ${activeTab} in ${selectedLocation} yet. Try the other city.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {activeList.map((item) => <VipCard key={item._id} establishment={item} />)}
          </div>
        )}
      </BrowseShell>
    </div>
  );
}