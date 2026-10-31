import { useState, useEffect } from 'react';
import { getCarById, getCars } from '../../../api/car';

// Loads the car for the page and a few similar cars from the same city.
export function useCarListing(id) {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarCars, setSimilarCars] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchCar() {
      try {
        setLoading(true);
        const data = await getCarById(id);
        setCar(data.data?.car || data.car || data);
      } catch (err) {
        console.error('Failed to load car details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id]);

  useEffect(() => {
    async function fetchSimilar() {
      if (!car?.location?.city) return;
      try {
        const res = await getCars();
        const allCars = res?.data?.cars || res?.cars || res?.data || [];
        const similar = allCars
          .filter((c) => (c._id || c.id) !== (car._id || car.id) && c.location?.city === car.location?.city)
          .slice(0, 4);
        setSimilarCars(similar);
      } catch (err) {
        console.error('Failed to load similar cars', err);
      }
    }
    if (car) fetchSimilar();
  }, [car]);

  return { car, loading, similarCars };
}
