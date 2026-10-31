import { useState, useMemo } from 'react';
import { checkCarAvailability } from '../../../api/car';
import { logUnifiedWhatsappIntent, saveCheckoutDraft } from '../../../api/reservation';
import { CONCIERGE_WHATSAPP } from '../../../lib/config';
import { toPickedIso } from '../useMonthCalendar';
import { slotRange, lagosIso, carTitle } from './carHelpers';

// All the booking state and actions for the car page: dates, add-ons, the live quote,
// the availability check, the checkout hand-off and the WhatsApp checkout.
export function useCarBooking({ car, images, user, setShowAuthModal, navigate }) {
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [durationSlots, setDurationSlots] = useState(1);
  const [needsChauffeur, setNeedsChauffeur] = useState(false);
  const [licenseAck, setLicenseAck] = useState(false);
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Changing the date, time or length makes any earlier availability answer stale.
  const resetAvailability = () => {
    setAvailabilityStatus(null);
    setBookingError('');
  };
  const changePickupDate = (value) => { setPickupDate(value); resetAvailability(); };
  const changePickupTime = (value) => { setPickupTime(value); resetAvailability(); };
  const changeDuration = (value) => { setDurationSlots(value); resetAvailability(); };

  const selectPickupDate = (dateObj) => {
    changePickupDate(toPickedIso(dateObj));
    setShowCalendar(false);
  };

  const chauffeurIncluded = /chauffeur/i.test(String(car?.category || '').replace(/_/g, ' '));

  const pricing = useMemo(() => {
    if (!car) return null;
    const baseRate = car.pricePer12Hours || 0;
    const chauffeurRate = needsChauffeur && !chauffeurIncluded ? 25000 * durationSlots : 0;
    const deliveryRate = needsDelivery && car.deliveryAvailable ? Number(car.deliveryFee || 0) : 0;
    const rentalTotal = baseRate * durationSlots;
    const subtotal = rentalTotal + chauffeurRate + deliveryRate;
    const platformFee = 0;
    const grandTotal = subtotal + platformFee;
    return { baseRate, rentalTotal, chauffeurRate, deliveryRate, subtotal, platformFee, grandTotal };
  }, [car, durationSlots, needsChauffeur, chauffeurIncluded, needsDelivery]);

  const handleCheckAvailability = async () => {
    if (!pickupDate || !pickupTime) {
      setBookingError('Please select a pick-up date and time first.');
      return false;
    }

    setIsCheckingAvailability(true);
    setBookingError('');

    try {
      const { start: pickupDateTime, end: dropoffDateTime } = slotRange(pickupDate, pickupTime, durationSlots);
      const response = await checkCarAvailability(car._id || car.id, {
        startDate: lagosIso(pickupDateTime),
        endDate: lagosIso(dropoffDateTime),
      });

      if (response.available) {
        setAvailabilityStatus('available');
        return true;
      }
      setAvailabilityStatus('booked');
      if (response.message) setBookingError(response.message);
      return false;
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to verify availability. Please try again.');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }
    if (!pickupDate) {
      setBookingError('Please select a pick-up date.');
      return;
    }
    if (!licenseAck) {
      setBookingError('Please confirm you hold a valid driving licence.');
      return;
    }
    if (needsDelivery && car.deliveryAvailable && deliveryAddress.trim().length < 4) {
      setBookingError('Please enter the address where we should deliver the car.');
      return;
    }
    if (availabilityStatus === 'booked') {
      setBookingError('These dates have been booked.');
      return;
    }

    setBookingLoading(true);

    if (availabilityStatus !== 'available') {
      const isAvailable = await handleCheckAvailability();
      if (!isAvailable) {
        setBookingLoading(false);
        return;
      }
    }

    const { start: pickupDateTime, end: dropoffDateTime } = slotRange(pickupDate, pickupTime, durationSlots);
    const fmt = (d) => d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
    const lines = [{ label: `₦${pricing.baseRate.toLocaleString()} x ${durationSlots} x 12 hrs`, amount: pricing.rentalTotal }];
    if (pricing.chauffeurRate) lines.push({ label: 'Chauffeur', amount: pricing.chauffeurRate });
    if (pricing.deliveryRate) lines.push({ label: 'Delivery', amount: pricing.deliveryRate });
    const details = [
      { label: 'Pick-up', value: fmt(pickupDateTime) },
      { label: 'Return', value: fmt(dropoffDateTime) },
      { label: 'Duration', value: `${durationSlots * 12} hours` },
      { label: 'Chauffeur', value: chauffeurIncluded ? 'Included' : needsChauffeur ? 'Yes' : 'No' },
    ];
    if (needsDelivery && car.deliveryAvailable) details.push({ label: 'Delivery address', value: deliveryAddress.trim() });

    saveCheckoutDraft({
      kind: 'car',
      tag: car.category || 'Car rental',
      title: carTitle(car),
      subtitle: [car.location?.city, car.location?.state].filter(Boolean).join(', '),
      image: images[0],
      backTo: `/cars/${car._id || car.id}`,
      details,
      lines,
      total: pricing.grandTotal,
      payload: {
        carId: car._id || car.id,
        pickupTime: lagosIso(pickupDateTime),
        dropoffTime: lagosIso(dropoffDateTime),
        totalAmount: pricing.grandTotal,
        withChauffeur: needsChauffeur && !chauffeurIncluded,
        licenseAck: true,
      },
    });
    setBookingLoading(false);
    navigate('/checkout');
  };

  const handleWhatsAppClick = async (e) => {
    e.preventDefault();

    if (!pickupDate || !pickupTime) {
      setBookingError('Please select your pickup date and time before contacting the concierge.');
      setShowCalendar(true);
      return;
    }
    if (!user) {
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }
    if (user.role !== 'USER') {
      setBookingError('Only guest accounts can make reservations.');
      return;
    }

    setIsWhatsappLoading(true);
    setBookingError('');

    try {
      // Drop-off follows the chosen duration (12 hours per block).
      const { start: pickupDateTime, end: dropoffDateTime } = slotRange(pickupDate, pickupTime, durationSlots);

      // 1. Log the intent so the concierge has a secure reference
      const response = await logUnifiedWhatsappIntent({
        assetId: car._id || car.id,
        assetType: 'CAR',
        startDate: lagosIso(pickupDateTime),
        endDate: lagosIso(dropoffDateTime),
        extraData: { withDriver: needsChauffeur && !chauffeurIncluded },
      });

      // 2. Retrieve the reference
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference');

      // 3. Put the reference into the message
      const waMessage = encodeURIComponent(
        `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I am interested in booking:\n\n` +
        `🚘 Vehicle: ${car.make} ${car.carModel} ${car.year}\n` +
        `📍 Location: ${car.location?.city || 'Not specified'}\n` +
        `📅 Pickup: ${pickupDate} at ${pickupTime}\n` +
        `⏱ Duration: ${durationSlots * 12} hours\n` +
        `👨‍✈️ Chauffeur: ${needsChauffeur ? 'Yes' : 'No'}\n` +
        (needsDelivery && car.deliveryAvailable ? `🚚 Delivery to: ${deliveryAddress.trim() || 'to be confirmed'}\n` : '') +
        `🔒 Reference: ${reference}\n\n` +
        'Could you please assist me with this reservation?'
      );

      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${waMessage}`, '_blank', 'noopener,noreferrer');
    } catch {
      setBookingError('Failed to initialize secure chat. Please try again.');
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  return {
    pickupDate, changePickupDate, selectPickupDate,
    pickupTime, changePickupTime,
    durationSlots, changeDuration,
    needsChauffeur, setNeedsChauffeur,
    licenseAck, setLicenseAck,
    needsDelivery, setNeedsDelivery,
    deliveryAddress, setDeliveryAddress,
    bookingLoading, bookingError,
    isCheckingAvailability, availabilityStatus,
    isWhatsappLoading,
    showCalendar, setShowCalendar,
    chauffeurIncluded, pricing,
    handleCheckAvailability, handleReservation, handleWhatsAppClick,
  };
}
