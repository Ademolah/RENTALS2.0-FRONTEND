import { useState, useEffect } from 'react';
import CarCard from '../components/CarCard';
import { apiClient } from '../api/client';

const CAR_CLASSES = ['All', 'SUV', 'Luxury', 'Sedan', 'Chauffeur', 'Van'];

export default function CarsList() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carClass, setCarClass] = useState('All');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiClient.get('/cars/all').then(res => {
      const d = res.data;
      const list = Array.isArray(d) ? d
        : d?.data?.cars || d?.cars || (Array.isArray(d?.data) ? d.data : []);
      // A host can pause a car listing (isAvailable: false) — it must not be discoverable.
      setCars(list.filter(c => c.isAvailable !== false));
    }).catch(() => {
      setError('Failed to load cars. Please try again.');
      setCars([]);
    }).finally(() => setLoading(false));
  }, []);

  const displayed = carClass === 'All' ? cars : cars.filter(c => {
    const cls = (c.vehicleClass || c.class || c.category || c.type || '').toLowerCase();
    return cls.includes(carClass.toLowerCase());
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center animate-in fade-in duration-500">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-600 mb-3 tracking-tight">
          Car Rentals
        </h1>
        <p className="text-gray-500 text-lg font-medium max-w-xl mx-auto">
          Premium vehicles for every occasion. Book a single day or extend your rental.
        </p>
        {/* Class filter chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {CAR_CLASSES.map(cls => (
            <button
              key={cls}
              onClick={() => setCarClass(cls)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                carClass === cls
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary mb-3" />
          <p className="font-medium text-sm">Loading cars...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <i className="fa-solid fa-circle-exclamation text-3xl text-red-400 mb-3 block" />
          <p className="text-gray-700 font-semibold">{error}</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <i className="fa-solid fa-car text-3xl text-gray-300 mb-3 block" />
          <h3 className="text-lg font-bold text-gray-700">No {carClass !== 'All' ? carClass : ''} cars available</h3>
          <p className="text-gray-400 text-sm mt-1">Try a different class or check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {displayed.map(car => <CarCard key={car._id} car={car} />)}
        </div>
      )}
    </main>
  );
}
