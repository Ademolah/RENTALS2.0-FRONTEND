import { useState, useEffect } from 'react';
import { getHotelById } from '../../../api/hotel';

// Loads the hotel for the page and selects its first suite.
export function useHotelListing(id) {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const response = await getHotelById(id);
        const data = response?.data?.hotel || response?.data?.property || response?.data || response;
        setHotel(data);
        if (data.roomTypes && data.roomTypes.length > 0) {
          setSelectedRoom(data.roomTypes[0]._id);
        }
      } catch (err) {
        console.error('Failed to load hotel:', err);
        setError('Unable to load hotel details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHotel();
  }, [id]);

  return { hotel, setHotel, loading, error, selectedRoom, setSelectedRoom };
}
