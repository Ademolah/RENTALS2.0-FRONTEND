import { useCallback, useEffect, useState } from 'react';
import { HostService } from '../../../api/host';
import { confirmPropertyCheckIn } from '../../../api/properties';
import { confirmCarHandover } from '../../../api/car';
import { confirmHotelCheckIn } from '../../../api/hotel';
import { confirmVipArrival } from '../../../api/vip';
import { loadHostBookings } from './bookingData';

// Booking ledger: loading, confirming check-in / handover, and cancelling a reservation.
export function useHostBookings(notify) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadHostBookings()
      .then(({ bookings: loaded, failedLoads }) => {
        if (cancelled) return;
        if (failedLoads > 0) notify('Some of your portfolio could not be loaded. Check your connection and refresh.');
        setBookings(loaded);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load portfolio data:', error);
        notify('Could not load your portfolio. Please refresh the page.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadToken, notify]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  const markReleased = (id) => setBookings((prev) => prev.map((x) => (x._id === id ? { ...x, escrowStatus: 'RELEASED' } : x)));

  const confirmBooking = async (booking) => {
    const { _id: id, type } = booking;
    const isCar = type === 'CAR';
    const isHotel = type === 'HOTEL';
    const isVip = type === 'VIP' || type === 'VIP_SERVICE';
    const guestAlreadyConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;

    setProcessingId(id);
    try {
      if (isCar) await confirmCarHandover(id);
      else if (isHotel) await confirmHotelCheckIn(id);
      else if (isVip) await confirmVipArrival(id); // venues and services share one backend action
      else await confirmPropertyCheckIn(id);

      const released = !!guestAlreadyConfirmed;
      setBookings((prev) => prev.map((b) => {
        if (b._id !== id) return b;
        const updated = { ...b };
        if (isCar) updated.ownerConfirmedHandover = true;
        else updated.checkInConfirmedByHost = true;
        if (released) updated.escrowStatus = 'RELEASED';
        return updated;
      }));

      notify(
        released
          ? 'Action complete. Funds have been released to your bank account.'
          : 'Action confirmed. Awaiting guest confirmation to release funds.',
        'success',
      );
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to execute action.';
      notify(`Action failed: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await HostService.cancelReservation(cancelTarget._id);
      setBookings((prev) => prev.map((b) => (b._id === cancelTarget._id ? { ...b, dead: true, reservationStatus: 'CANCELLED' } : b)));
      notify('Reservation cancelled. The payment goes to Rentals Africa for review.', 'success');
    } catch (e) {
      notify(e?.response?.data?.message || 'The reservation could not be cancelled. Please try again.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  return {
    bookings, isLoading, reload, markReleased,
    processingId, confirmBooking,
    cancelTarget, cancelling, askCancel: setCancelTarget, dismissCancel: () => !cancelling && setCancelTarget(null), confirmCancel,
  };
}
