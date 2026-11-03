import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react
import { getFavourites, toggleFavourite } from '../api/favourites';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => Number(n || 0).toLocaleString();

function FavCard({ item, onRemove }) {
  const [removing, setRemoving] = useState(false);

  const iscar = item._type === 'car';
  const ishotel = item._type === 'hotel';
  const isvip = item._type === 'vip';

  const href = iscar
    ? `/cars/${item._id}`
    : ishotel
    ? `/hotels/${item._id}`
    : isvip
    ? `/vip/${item._id}`
    : `/property/${item._id}`;

  const price = item.pricePerNight || item.pricePer12Hours || item.price || 0;
  const priceLabel = iscar ? 'per day' : ishotel ? '/ night' : isvip ? '/ event' : '/ night';
  const image = item.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
  const location = typeof item.address === 'object'
    ? `${item.address?.city}, ${item.address?.state}`
    : typeof item.location === 'object'
    ? `${item.location?.city}, ${item.location?.state}`
    : item.location || item.address || '';

  const typeIconClass = iscar ? 'fa-car' : ishotel ? 'fa-building' : 'fa-house';

  const handleRemove = async (e) => {
    e.preventDefault();
    setRemoving(true);
    try {
      await toggleFavourite(item._id);
      onRemove(item._id);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className="group relative flex flex-col gap-3">
      <Link to={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
          <img src={image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-wider shadow-sm">
            <i className={`fa-solid ${typeIconClass} text-[10px]`} />
            {iscar ? 'Car' : ishotel ? 'Hotel' : isvip ? 'VIP' : 'Stay'}
          </div>
        </div>
        <div className="mt-3 px-1">
          <p className="font-semibold text-gray-900 truncate">{item.title || (iscar ? `${item.make} ${item.carModel}` : 'Listing')}</p>
          {location && <p className="text-sm text-gray-500 truncate">{location}</p>}
          <p className="mt-1 font-bold text-gray-900">
            ₦{fmt(price)} <span className="text-xs font-normal text-gray-500">{priceLabel}</span>
          </p>
        </div>
      </Link>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-transform"
        aria-label="Remove from saved"
      >
        {removing
          ? <i className="fa-solid fa-spinner fa-spin text-sm text-gray-400" />
          : <i className="fa-solid fa-heart text-sm text-brand-primary" />}
      </button>
    </div>
  );
}

export default function SavedListings() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getFavourites()
      .then(res => {
        const list = res?.data?.favorites || res?.favorites || res?.data || [];
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = (id) => setItems(prev => prev.filter(i => i._id !== id));

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <i className="fa-solid fa-heart text-4xl text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Log in to see your saved listings</h2>
      <p className="text-gray-500 text-sm">Tap the heart on any listing to save it for later.</p>
    </div>
  );

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Saved listings</h1>
        {!loading && <p className="text-gray-500 text-sm">{items.length} {items.length === 1 ? 'listing' : 'listings'} saved</p>}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary mb-3" />
          <p className="text-gray-400 text-sm">Loading your saved listings…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <i className="fa-regular fa-heart text-5xl text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">No saved listings yet</h2>
          <p className="text-gray-500 text-sm mb-6">Tap the heart icon on any listing to save it here.</p>
          <Link to="/" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {items.map(item => (
            <FavCard key={item._id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </main>
  );
}
