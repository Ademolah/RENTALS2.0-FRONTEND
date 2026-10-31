import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BookModal from '../components/BookModal';
import InteractiveMap from '../components/InteractiveMap';
import { useToast } from '../components/Toast';
import ReviewsSection from '../components/detail/ReviewsSection';
import { ManageListingCard } from '../components/detail/detailParts';
import { isOwnListing } from '../components/detail/detailUtils';
import { useAuth } from '../context/AuthContext';
import { useDocumentMeta } from '../lib/seo';
import { useHotelListing } from '../components/detail/hotel/useHotelListing';
import { useHotelBooking } from '../components/detail/hotel/useHotelBooking';
import { useHotelReview } from '../components/detail/hotel/useHotelReview';
import HotelGallery from '../components/detail/hotel/HotelGallery';
import HotelLightbox from '../components/detail/hotel/HotelLightbox';
import HotelReviewModal from '../components/detail/hotel/HotelReviewModal';
import HotelInfo from '../components/detail/hotel/HotelInfo';
import HotelDatePicker from '../components/detail/hotel/HotelDatePicker';
import RoomList from '../components/detail/hotel/RoomList';
import { HotelBookingCard, HotelMobileBookingCard } from '../components/detail/hotel/HotelBookingCards';

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuthModal } = useAuth();
  const toast = useToast();

  const { hotel, setHotel, loading, error, selectedRoom, setSelectedRoom } = useHotelListing(id);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const booking = useHotelBooking({ hotel, selectedRoom, user, setShowAuthModal, toast });
  const review = useHotelReview({ hotel, setHotel, user, toast });

  useDocumentMeta(hotel?.title, hotel?.description?.slice(0, 160));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="text-brand-text-secondary font-medium tracking-wide">Preparing hotel details...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 text-brand-text-secondary font-bold">
        Hotel not found or is no longer available.
      </div>
    );
  }

  const ownListing = isOwnListing(user, hotel.ownerId?._id || hotel.ownerId || hotel.landlordId?._id || hotel.landlordId);
  const hotelStatus = String(hotel.status || '').toLowerCase();
  const { isLoggedIn, activeRoomData } = booking;

  const writeReview = () => {
    if (!isLoggedIn) setShowAuthModal?.(true);
    else if (user?.role === 'USER') review.setShowReviewModal(true);
    else toast.show('Only guest accounts can submit reviews.');
  };

  return (
    <main className="bg-white min-h-screen pb-32 lg:pb-12 relative animate-in fade-in duration-500">
      {review.showReviewModal && (
        <HotelReviewModal
          form={review.reviewForm}
          setForm={review.setReviewForm}
          error={review.reviewError}
          submitting={review.isSubmittingReview}
          onSubmit={review.handleReviewSubmit}
          onClose={() => review.setShowReviewModal(false)}
        />
      )}

      {lightboxIndex !== null && (
        <HotelLightbox images={hotel.images} index={lightboxIndex} onChange={setLightboxIndex} />
      )}

      <HotelGallery hotel={hotel} onBack={() => navigate(-1)} onOpen={setLightboxIndex} />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          <div className="w-full lg:w-2/3 space-y-10">
            <HotelInfo hotel={hotel} />

            <hr className="border-gray-200" />
            <HotelDatePicker booking={booking} city={hotel.address?.city} />

            <hr className="border-gray-200" />
            <RoomList hotel={hotel} selectedRoom={selectedRoom} onSelect={setSelectedRoom} />

            <hr className="border-gray-200" />
            <div id="reviews-section" className="pt-4">
              <ReviewsSection
                listingId={hotel._id || hotel.id}
                fallback={{ rating: hotel.rating, count: hotel.reviewsCount }}
                refreshKey={review.reviewsKey}
                onWrite={writeReview}
              />
            </div>

            <hr className="border-gray-200" />
            <div>
              <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-4">Location</h2>
              <div className="w-full h-[440px] rounded-3xl overflow-hidden border border-gray-100 shadow-card relative bg-gray-50">
                <InteractiveMap address={hotel.address} type="HOTEL" />
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-1/3 relative">
            {ownListing ? (
              <div className="sticky top-28"><ManageListingCard status={hotelStatus} /></div>
            ) : (
              <HotelBookingCard booking={booking} />
            )}
          </div>

        </div>
      </div>

      {ownListing ? (
        <div className="lg:hidden px-4 mt-6"><ManageListingCard status={hotelStatus} /></div>
      ) : (
        <HotelMobileBookingCard booking={booking} />
      )}

      {activeRoomData && (
        <BookModal
          isOpen={booking.isBookModalOpen}
          onClose={() => booking.setIsBookModalOpen(false)}
          roomData={activeRoomData}
          hotelData={hotel}
          checkIn={booking.checkInDate}
          checkOut={booking.checkOutDate}
          isLoggedIn={isLoggedIn}
          onDatesChange={(s, e) => { booking.setCheckInDate(s); booking.setCheckOutDate(e); }}
          onSignIn={() => { booking.setIsBookModalOpen(false); setShowAuthModal?.(true); }}
        />
      )}
    </main>
  );
}
