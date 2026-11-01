import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import HotelListingView from '../components/HotelCard';
import { getProperties } from '../api/properties';

const TABS = [
  { key: 'shortlets', label: 'Shortlets', icon: 'fa-solid fa-house' },
  { key: 'hotels',    label: 'Hotels',    icon: 'fa-solid fa-hotel' },
];

export default function Stays() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stayTab, setStayTab] = useState(searchParams.get('tab') || 'shortlets');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const city = searchParams.get('city') || 'Lagos';

  useEffect(() => {
    setSearchParams(p => { const n = new URLSearchParams(p); n.set('tab', stayTab); return n; }, { replace: true });
  }, [stayTab]);

  useEffect(() => {
    if (stayTab === 'hotels') { setLoading(false); return; }
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getProperties({ category: 'shortlet', city });
        const list = Array.isArray(data) ? data
          : data?.data?.properties || data?.properties
          || (Array.isArray(data?.data) ? data.data : []);
        setListings(list);
      } catch {
        setError('Failed to load shortlets. Please try again.');
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stayTab, city]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {stayTab === 'hotels' ? 'Hotels' : 'Shortlets'} in {city}
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStayTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                stayTab === t.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <i className={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        {stayTab === 'hotels' ? (
          <HotelListingView activeCityContext={city} />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary mb-3" />
            <p className="font-medium text-sm">Loading listings...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <i className="fa-solid fa-circle-exclamation text-3xl text-red-400 mb-3 block" />
            <p className="text-gray-700 font-semibold mb-2">{error}</p>
            <button onClick={() => setListings([])} className="text-sm text-brand-primary font-semibold hover:underline">Retry</button>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <i className="fa-solid fa-building text-3xl text-gray-300 mb-3 block" />
            <h3 className="text-lg font-bold text-gray-700">No shortlets found in {city}</h3>
            <p className="text-gray-400 text-sm mt-1">Try a different city or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
            {listings.map(p => (
              <PropertyCard
                key={p._id}
                property={{
                  id: p._id,
                  title: p.title,
                  location: p.address?.city && p.address?.state
                    ? `${p.address.city}, ${p.address.state}`
                    : p.address?.city || city,
                  price: Number(p.pricePerNight || p.price || 0),
                  rating: p.rating || 0,
                  numReviews: p.numReviews || 0,
                  isRentalVerified: p.isVerified ?? true,
                  images: p.images,
                  image: p.images?.[0],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
