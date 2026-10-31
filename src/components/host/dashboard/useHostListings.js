import { useCallback, useEffect, useState } from 'react';
import { fetchMyListings, setListingAvailable } from '../hostApi';

// The host's own listings (all four kinds), plus the pause / resume action.
export function useHostListings(userId, notify) {
  const [listings, setListings] = useState([]);
  const [state, setState] = useState('loading');
  const [togglingId, setTogglingId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchMyListings(userId)
      .then(({ items, failed }) => {
        if (cancelled) return;
        setListings(items);
        setState(failed === 4 ? 'error' : 'ready');
        if (failed > 0 && failed < 4) notify('Some of your listings could not be loaded. Refresh to try again.');
      })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [userId, reloadToken, notify]);

  const reload = useCallback(() => {
    setState('loading');
    setReloadToken((t) => t + 1);
  }, []);

  const toggleAvailability = async (listing) => {
    const makeAvailable = listing.status === 'paused';
    setTogglingId(listing.id);
    try {
      await setListingAvailable(listing, makeAvailable);
      setListings((prev) => prev.map((l) => (
        l.id === listing.id
          ? { ...l, status: makeAvailable ? 'active' : 'paused', raw: { ...l.raw, isAvailable: makeAvailable } }
          : l
      )));
      notify(makeAvailable ? 'Listing is available again.' : 'Listing marked as unavailable.', 'success');
    } catch (error) {
      notify(error?.response?.data?.message || 'Could not update this listing. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  return { listings, state, reload, togglingId, toggleAvailability };
}
