import { useState } from 'react';
import { checkHotelRoomAvailability } from '../../../api/hotel';
import { logUnifiedWhatsappIntent } from '../../../api/reservation';
import { CONCIERGE_WHATSAPP } from '../../../lib/config';
import { toPickedIso } from '../useMonthCalendar';
import { countNights } from './hotelHelpers';

// Dates, calendar state, the live price and the two ways to book (Reserve dialog or WhatsApp).
export function useHotelBooking({ hotel, selectedRoom, user, setShowAuthModal, toast }) {
  const isLoggedIn = Boolean(user);

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('checkIn');

  const activeRoomData = hotel?.roomTypes?.find((r) => r._id === selectedRoom);
  const nights = countNights(checkInDate, checkOutDate);
  const basePricePerNight = activeRoomData?.pricePerNight || hotel?.startingPrice || 0;
  const totalPrice = basePricePerNight * nights;

  const showToast = (message) => toast.show(message);

  const openCalendar = (mode) => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  const selectDate = (dateObj) => {
    const dateStr = toPickedIso(dateObj);

    if (calendarMode === 'checkIn') {
      setCheckInDate(dateStr);
      if (checkOutDate && dateStr >= checkOutDate) {
        setCheckOutDate('');
      }
      setCalendarMode('checkOut');
    } else {
      setCheckOutDate(dateStr);
      setShowCalendar(false);
    }
  };

  const handleBookClick = () => {
    if (!isLoggedIn) {
      if (setShowAuthModal) setShowAuthModal(true);
      else showToast('Please log in or register to secure a reservation.');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      showToast('Please select your check-in and check-out dates.');
      return;
    }
    setIsBookModalOpen(true);
  };

  const handleWhatsAppClick = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      if (setShowAuthModal) setShowAuthModal(true);
      else showToast('Please log in or register to secure a reservation.');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      showToast('Please select your check-in and check-out dates first.');
      openCalendar('checkIn');
      return;
    }
    if (user?.role !== 'USER') {
      showToast('Only guest accounts can make reservations.');
      return;
    }

    setIsWhatsappLoading(true);

    try {
      if (selectedRoom) {
        const avail = await checkHotelRoomAvailability(hotel._id || hotel.id, selectedRoom, { checkIn: checkInDate, checkOut: checkOutDate });
        if ((avail?.data?.available ?? avail?.available) === false) {
          showToast('These dates have been booked. Please pick other dates.');
          return;
        }
      }
      // 1. Log the intent so the concierge has a secure reference
      const response = await logUnifiedWhatsappIntent({
        assetId: hotel._id || hotel.id,
        assetType: 'HOTEL',
        startDate: new Date(checkInDate).toISOString(),
        endDate: new Date(checkOutDate).toISOString(),
        extraData: {
          roomId: selectedRoom,
          guests: activeRoomData?.capacity?.adults || 2,
        },
      });

      // 2. Retrieve the reference
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference');

      // 3. Put the reference into the message
      const message = `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I am interested in booking:\n\n` +
        `🏨 Hotel: ${hotel.title}\n` +
        `🛏️ Suite: ${activeRoomData?.name || 'Suite'}\n` +
        `📅 Check-in: ${new Date(checkInDate).toLocaleDateString()}\n` +
        `📅 Check-out: ${new Date(checkOutDate).toLocaleDateString()}\n` +
        `🔒 Reference: ${reference}\n\n` +
        'Could you please assist me with this reservation?';

      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } catch {
      showToast('Failed to initialize secure chat. Please try again.');
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  return {
    isLoggedIn,
    checkInDate, checkOutDate, setCheckInDate, setCheckOutDate,
    isBookModalOpen, setIsBookModalOpen,
    isWhatsappLoading,
    showCalendar, setShowCalendar, calendarMode, openCalendar, selectDate,
    activeRoomData, nights, totalPrice,
    handleBookClick, handleWhatsAppClick,
  };
}
