import { useState, useEffect, useRef } from 'react';
import { CONCIERGE_WHATSAPP } from '../lib/config';
import { toLocalISO } from '../lib/dates';
import { MapPin, Star, Coffee, Wifi, ChevronLeft, ChevronRight, Droplets, Bed, Utensils, Car, CheckCircle2, Wine, CalendarDays, Users, Info, ArrowLeft, Loader2, Dumbbell, Leaf, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BookModal from '../components/BookModal';
import InteractiveMap from '../components/InteractiveMap';
import { getHotelById } from '../api/hotel';
import { createPropertyReviewApi } from '../api/reviews';
import { useToast } from '../components/Toast';
import { WhatsAppCheckout, WhatsAppPill } from '../components/ui';
import ReviewsSection from '../components/detail/ReviewsSection';
import { StayFacts, DirectionsLink, ManageListingCard, isOwnListing, useSwipe, coordsOf } from '../components/detail/extras';
import { useAuth } from '../context/AuthContext';
import { logUnifiedWhatsappIntent } from '../api/reservation';
import { useDocumentMeta } from '../lib/seo';
import ShareButton from '../components/ShareButton';
import { checkHotelRoomAvailability } from '../api/hotel';

// PRESET_AMENITIES Match
const getAmenityIcon = (amenity) => {
  if (!amenity) return CheckCircle2;
  const name = amenity.toLowerCase();
  
  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('pool') || name.includes('swim')) return Droplets;
  if (name.includes('restaurant') || name.includes('dining') || name.includes('food')) return Utensils;
  if (name.includes('fitness') || name.includes('gym')) return Dumbbell;
  if (name.includes('bar') || name.includes('lounge')) return Wine;
  if (name.includes('spa') || name.includes('wellness')) return Leaf;
  if (name.includes('valet') || name.includes('park')) return Car;
  if (name.includes('room service')) return Coffee;
  if (name.includes('bed') || name.includes('room') || name.includes('suite')) return Bed;
  
  return CheckCircle2; 
};

export default function HotelDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const galleryRef = useRef(null);
  const swipe = useSwipe((dir) => setLightboxIndex((i) => (i === null ? i : (i - dir + (hotel?.images?.length || 1)) % (hotel?.images?.length || 1))));
  
  const { user, setShowAuthModal } = useAuth();
  const isLoggedIn = Boolean(user);

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const toast = useToast();
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  useDocumentMeta(hotel?.title, hotel?.description?.slice(0, 160));

  // --- LIGHTBOX STATE ---
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // --- REVIEWS STATE ---
  const [reviewsKey, setReviewsKey] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // --- BESPOKE CALENDAR STATE ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('checkIn'); 
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchHotelAndReviews = async () => {
      try {
        setLoading(true);
        // Fetch Hotel
        const response = await getHotelById(id);
        const data = response?.data?.hotel || response?.data?.property || response?.data || response;
        setHotel(data);
        if (data.roomTypes && data.roomTypes.length > 0) {
          setSelectedRoom(data.roomTypes[0]._id);
        }
      } catch {
        console.error("Failed to load hotel:", err);
        setError("Unable to load hotel details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHotelAndReviews();
  }, [id]);

  const showToast = (message) => toast.show(message);

  const handleWhatsAppClick = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      if (setShowAuthModal) setShowAuthModal(true);
      else showToast("Please log in or register to secure a reservation.");
      return;
    }

    if (!checkInDate || !checkOutDate) {
      showToast("Please select your check-in and check-out dates first.");
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
      // 1. Fire intent to database
      const response = await logUnifiedWhatsappIntent({
        assetId: hotel._id || hotel.id,
        assetType: 'HOTEL',
        startDate: new Date(checkInDate).toISOString(),
        endDate: new Date(checkOutDate).toISOString(),
        extraData: { 
          roomId: selectedRoom,
          guests: activeRoomData?.capacity?.adults || 2
        }
      });

      // 2. Retrieve secure reference
      const reference = response.data?.data?.reference || response.data?.reference;
      if (!reference) throw new Error('No reference');

      // 3. Inject reference into the message
      const message = `Hi Rentals Africa, I am ${user.firstName}, a verified guest. I am interested in booking:\n\n` +
                      `🏨 Hotel: ${hotel.title}\n` +
                      `🛏️ Suite: ${activeRoomData?.name || 'Suite'}\n` +
                      `📅 Check-in: ${new Date(checkInDate).toLocaleDateString()}\n` +
                      `📅 Check-out: ${new Date(checkOutDate).toLocaleDateString()}\n` +
                      `🔒 Reference: ${reference}\n\n` +
                      `Could you please assist me with this reservation?`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast("Failed to initialize secure chat. Please try again.");
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  const handleBookClick = () => {
    if (!isLoggedIn) {
      if (setShowAuthModal) setShowAuthModal(true);
      else showToast("Please log in or register to secure a reservation.");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      showToast("Please select your check-in and check-out dates.");
      return;
    }
    setIsBookModalOpen(true);
  };

  // --- REVIEW SUBMISSION LOGIC ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (reviewForm.rating === 0) {
      setReviewError('Please select a rating score.');
      return;
    }
    if (reviewForm.comment.trim().length < 10) {
      setReviewError('Please provide a comment of at least 10 characters.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      
      // 💡 THE FIX: Securely grab the token from localStorage if user.token is undefined
      const token = user?.token || localStorage.getItem('rentals_token');
      
      const res = await createPropertyReviewApi(hotel._id, reviewForm, token);
      
      if (res.success) {
        setReviewsKey((k) => k + 1);
        
        setHotel(prev => ({
          ...prev,
          rating: res.updatedPropertyStats?.rating || prev.rating,
          reviewsCount: res.updatedPropertyStats?.numReviews || prev.reviewsCount + 1
        }));

        setShowReviewModal(false);
        setReviewForm({ rating: 0, comment: '' });
        showToast("Review submitted successfully!");
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  // --- LIGHTBOX LOGIC ---
  const nextImage = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % hotel.images.length); };
  const prevImage = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1)); };

  const scrollGallery = (direction) => {
    if (galleryRef.current) {
      const scrollAmount = window.innerWidth * 0.6; 
      galleryRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // --- BESPOKE CALENDAR LOGIC ---
  const todayDateObj = new Date();
  todayDateObj.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };

  const handleDateSelect = (dateObj) => {
    const offsetDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    const dateStr = offsetDate.toISOString().split('T')[0];

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

  const nextMonth = (e) => { e.preventDefault(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); };
  const prevMonth = (e) => { e.preventDefault(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); };

  const openCalendar = (mode) => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1;
  };

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
  const activeRoomData = hotel.roomTypes?.find(r => r._id === selectedRoom);
  const nights = calculateNights();
  const basePricePerNight = activeRoomData?.pricePerNight || hotel.startingPrice || 0;
  const totalPrice = basePricePerNight * nights;

  return (
    <main className="bg-white min-h-screen pb-32 lg:pb-12 relative animate-in fade-in duration-500">
      
      {/* REVIEW SUBMISSION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-elevated relative">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-5 right-5 text-brand-text-muted hover:text-brand-dark transition-colors"
             aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-4 w-0.5 bg-brand-primary"></div>
                <span className="text-xs font-display font-bold text-brand-primary uppercase tracking-[0.25em]">
                  Guest Feedback
                </span>
              </div>
              
              <h3 className="text-2xl font-display font-bold text-brand-dark tracking-tight mb-2">Rate your stay</h3>
              <p className="text-sm font-medium text-brand-text-secondary mb-8">Your feedback helps maintain our world-class standard.</p>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">Overall Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none transition-transform active:scale-90"
                      >
                        <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-gray-900 text-brand-dark' : 'fill-transparent text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">Written Review</label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share the details of your stay..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none"
                  ></textarea>
                </div>

                {reviewError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                    {reviewError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-4 bg-brand-dark hover:bg-brand-accent text-white rounded-xl text-base font-bold tracking-wider uppercase transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center shadow-lg"
                >
                  {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESTORED LIGHTBOX */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setLightboxIndex(null)} {...swipe}>
          <button 
            onClick={() => setLightboxIndex(null)} 
            className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
           aria-label="Close">
            <X className="w-8 h-8" />
          </button>
          
          {hotel.images.length > 1 && (
            <button 
              onClick={prevImage} 
              className="absolute left-4 md:left-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all"
             aria-label="Previous">
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          <img 
            src={hotel.images[lightboxIndex]} 
            alt="Expanded view" 
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {hotel.images.length > 1 && (
            <button 
              onClick={nextImage} 
              className="absolute right-4 md:right-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all"
             aria-label="Next">
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
          
          <div className="absolute bottom-8 left-0 w-full text-center text-white/70 font-semibold tracking-wide text-base">
            {lightboxIndex + 1} / {hotel.images.length}
          </div>
        </div>
      )}

      {/* 1. SCROLLABLE IMAGE GALLERY */}
      <div className="w-full bg-white overflow-hidden relative group pt-4">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-30 bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition shadow-md" aria-label="Go back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="absolute top-6 right-6 z-30 flex items-center gap-2"><WhatsAppPill /><ShareButton dark className="backdrop-blur-md" /></div>

       <button onClick={() => scrollGallery('left')} className="absolute top-1/2 left-4 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl" aria-label="Previous">
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <button onClick={() => scrollGallery('right')} className="absolute top-1/2 right-4 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary transition opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl" aria-label="Next">
          <ChevronRight className="w-8 h-8" />
        </button>
        
        {hotel.images?.length > 0 && (
          <button onClick={() => setLightboxIndex(0)} className="absolute bottom-6 right-6 z-20 bg-white text-brand-dark font-semibold text-base px-5 py-3 rounded-xl shadow-elevated hover:bg-gray-50">
            View all {hotel.images.length} photo{hotel.images.length !== 1 ? 's' : ''}
          </button>
        )}
        <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-[40vh] md:h-[60vh] scroll-smooth">
          {hotel.images?.map((img, index) => (
            <div 
              key={index} 
              onClick={() => setLightboxIndex(index)}
              className="min-w-[85vw] md:min-w-[60vw] lg:min-w-[45vw] h-full snap-center relative p-1 cursor-pointer"
            >
              <img src={img} alt={`${hotel.title} - view ${index + 1}`} className="w-full h-full object-cover rounded-3xl hover:opacity-95 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-2/3 space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl md:text-6xl font-display font-bold text-brand-dark tracking-tight leading-[1.05]">
                  {hotel.title}
                </h1>
                <div className="hidden md:flex flex-col items-end ml-4">
                  <div className="bg-brand-primary text-white font-display font-bold text-xl px-4 py-2 rounded-xl shadow-sm">
                    {hotel.reviewsCount > 0 ? hotel.rating?.toFixed(1) : 'New'}
                  </div>
                  <span className="text-sm font-bold text-brand-text-secondary mt-1">
                    {hotel.reviewsCount || 0} review{hotel.reviewsCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 text-sm font-medium mb-6">
                <MapPin className="w-5 h-5 mr-2 text-brand-primary shrink-0" />
                <span className="text-lg">{hotel.address?.street}, {hotel.address?.city}, {hotel.address?.state}</span>
              </div>
              <DirectionsLink {...coordsOf(hotel.address?.coordinates || hotel.location?.coordinates)} address={[hotel.address?.street, hotel.address?.city, hotel.address?.state].filter(Boolean).join(', ')} />
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-2">About this hotel</h2>
              <p className="mb-4 text-base font-medium text-brand-text-secondary">Managed by Rentals Africa</p>
              <p className="text-brand-text-secondary leading-8 text-lg whitespace-pre-line">
                {hotel.description}
              </p>
            </div>

            <StayFacts checkInTime={hotel.checkInTime} checkOutTime={hotel.checkOutTime} price={hotel.startingPrice} />

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-6">Premium Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  {hotel.amenities.map((amenity, idx) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <div key={idx} className="flex items-center text-brand-dark text-base font-medium">
                        <div className="p-3 bg-brand-primary-soft rounded-xl mr-3">
                          <Icon className="w-5 h-5 text-brand-primary" />
                        </div>
                        {amenity}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* BESPOKE DATE PICKER INJECTED HERE */}
            <div id="dates-section" className="pt-2 pb-4">
              <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-2">Select your dates</h2>
              <p className="text-brand-text-secondary text-base font-medium mb-6">
                {checkInDate && checkOutDate 
                  ? `${nights} ${nights === 1 ? 'night' : 'nights'} in ${hotel.address?.city}`
                  : "Add your travel dates for exact pricing"}
              </p>
              
              <div className="relative max-w-xl">
                <div className={`border rounded-2xl overflow-hidden bg-white shadow-sm transition-all flex flex-col sm:flex-row ${showCalendar ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-gray-300'}`}>
                  
                  {/* Check In Block */}
                  <div 
                    onClick={() => openCalendar('checkIn')}
                    className={`flex-1 p-4 border-b sm:border-b-0 sm:border-r border-gray-300 cursor-pointer transition-colors ${calendarMode === 'checkIn' && showCalendar ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <label className="text-xs font-display font-bold text-brand-text-secondary uppercase tracking-widest mb-1 block">Check-In</label>
                    <div className={`text-base ${checkInDate ? 'font-bold text-brand-dark' : 'font-medium text-brand-text-muted'}`}>
                      {checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Add Date'}
                    </div>
                  </div>

                  {/* Check Out Block */}
                  <div 
                    onClick={() => openCalendar('checkOut')}
                    className={`flex-1 p-4 cursor-pointer transition-colors ${calendarMode === 'checkOut' && showCalendar ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <label className="text-xs font-display font-bold text-brand-text-secondary uppercase tracking-widest mb-1 block">Checkout</label>
                    <div className={`text-base ${checkOutDate ? 'font-bold text-brand-dark' : 'font-medium text-brand-text-muted'}`}>
                      {checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Add Date'}
                    </div>
                  </div>
                </div>

                {/* Calendar Popover */}
                {showCalendar && (
                  <div className="absolute top-[85px] sm:top-[75px] left-0 mt-2 w-full sm:w-[320px] bg-white border border-gray-200 shadow-elevated rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                      <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Previous"><ChevronLeft className="w-4 h-4"/></button>
                      <span className="font-display font-bold text-base tracking-widest uppercase text-brand-dark">
                        {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Next"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-display font-bold text-brand-text-muted tracking-widest uppercase">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-y-2">
                      {generateCalendarDays().map((dateObj, i) => {
                        if (!dateObj) return <div key={i} className="h-8"></div>;
                        
                        const dateStr = toLocalISO(dateObj);
                        const isPast = dateObj < todayDateObj;
                        const isSelectedIn = dateStr === checkInDate;
                        const isSelectedOut = dateStr === checkOutDate;
                        const isBetween = checkInDate && checkOutDate && dateStr > checkInDate && dateStr < checkOutDate;
                        
                        const isDisabledForCheckOut = calendarMode === 'checkOut' && checkInDate && dateStr <= checkInDate;
                        const disabled = isPast || isDisabledForCheckOut;

                        let bgClass = 'hover:bg-gray-100 text-brand-dark';
                        if (disabled) bgClass = 'text-gray-300 cursor-not-allowed';
                        if (isBetween) bgClass = 'bg-brand-primary/10 text-brand-dark';
                        if (isSelectedIn || isSelectedOut) bgClass = 'bg-brand-primary text-white shadow-md';

                        return (
                          <button
                            key={i}
                            disabled={disabled}
                            onClick={(e) => { e.preventDefault(); handleDateSelect(dateObj); }}
                            className={`h-9 w-9 mx-auto rounded-full text-sm font-bold transition-all flex items-center justify-center ${bgClass}`}
                          >
                            {dateObj.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">
                        Selecting: {calendarMode === 'checkIn' ? 'Check-in' : 'Check-out'}
                      </span>
                      <button 
                        onClick={(e) => { e.preventDefault(); setShowCalendar(false); }}
                        className="text-xs font-bold text-brand-dark underline underline-offset-2 hover:text-brand-primary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            <div id="rooms-section">
              <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-6">Available Suites</h2>
              <div className="space-y-6">
                {hotel.roomTypes?.map((room) => {
                  const isSelected = selectedRoom === room._id;
                  const roomImage = room.images && room.images.length > 0 ? room.images[0] : hotel.images[0];
                  
                  return (
                    <div 
                      key={room._id} 
                      onClick={() => setSelectedRoom(room._id)}
                      className={`flex flex-col sm:flex-row bg-white rounded-3xl overflow-hidden border transition-all cursor-pointer shadow-soft hover:shadow-card-hover ${
                        isSelected ? 'border-brand-primary ring-1 ring-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full sm:w-1/3 h-48 sm:h-auto">
                        <img src={roomImage} alt={room.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-display font-bold text-brand-dark">{room.name}</h3>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                          <div className="flex items-center text-brand-text-secondary text-base mt-2 mb-4 space-x-4">
                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {room.capacity?.adults || 2} Guests</span>
                            <span className="flex items-center"><Bed className="w-4 h-4 mr-1" /> Suite</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {room.amenities?.map((am, i) => (
                              <span key={i} className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-md">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                          <span className="text-2xl font-display font-bold text-brand-dark tracking-tight">
                            ₦{room.pricePerNight.toLocaleString()} <span className="text-base font-medium text-brand-text-secondary">/ night</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* REVIEWS */}
            <div id="reviews-section" className="pt-4">
              <ReviewsSection
                listingId={hotel._id || hotel.id}
                fallback={{ rating: hotel.rating, count: hotel.reviewsCount }}
                refreshKey={reviewsKey}
                onWrite={() => {
                  if (!isLoggedIn) setShowAuthModal?.(true);
                  else if (user?.role === 'USER') setShowReviewModal(true);
                  else showToast('Only guest accounts can submit reviews.');
                }}
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

          {/* RIGHT COLUMN: Sticky Booking Sidebar (Desktop Only) */}
          <div className="hidden lg:block w-1/3 relative">
            {ownListing ? (
              <div className="sticky top-28"><ManageListingCard status={String(hotel.status || '').toLowerCase()} /></div>
            ) : (
            <div className="sticky top-28 bg-white border border-gray-100 rounded-3xl p-7 shadow-elevated">
              
              <div className="mb-6 flex flex-col items-start border-b border-gray-100 pb-6">
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-display font-bold text-brand-dark tracking-tight">
                    ₦{totalPrice.toLocaleString()}
                  </span>
                  <span className="text-brand-text-secondary font-medium">total</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700 mt-2 bg-green-50/80 px-2 py-1 rounded-md border border-green-100">
                  Taxes & fees included
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 space-y-3">
                <div className="flex items-start text-base text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary mr-2 mt-0.5 shrink-0" />
                  <span>Suite: <strong>{activeRoomData?.name}</strong></span>
                </div>
                <div className="flex items-start text-base text-brand-dark">
                  <CalendarDays className="w-4 h-4 text-brand-primary mr-2 mt-0.5 shrink-0" />
                  <span>Duration: <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong></span>
                </div>
                <div className="flex items-start text-base text-brand-dark">
                  <Info className="w-4 h-4 text-brand-text-muted mr-2 mt-0.5 shrink-0" />
                  <span>You won't be charged yet.</span>
                </div>
              </div>

              <div className="space-y-3 relative z-0">
                <button 
                  onClick={handleBookClick}
                  className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-hover transition-all active:scale-[0.98] shadow-glow"
                >
                  {isLoggedIn ? "Reserve Now" : "Login to Reserve"}
                </button>
                
                <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!(isWhatsappLoading)} />
                <p className="mt-3 text-sm text-brand-text-secondary leading-snug">Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment. Rentals Africa reviews and processes refunds.</p>
              </div>
            </div>
            )}
          </div>

        </div>
      </div>

      {/* Booking card on small screens */}
      {!ownListing && (
      <div className="lg:hidden mx-4 my-8 bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold text-green-700 uppercase tracking-widest bg-green-50 px-2 py-1 rounded">Taxes incl.</span>
          <span className="text-2xl font-display font-bold text-brand-dark tracking-tight">₦{totalPrice.toLocaleString()}</span>
        </div>
        <button
          onClick={handleBookClick}
          className="w-full bg-brand-primary text-white text-lg font-bold px-6 py-4 rounded-2xl hover:opacity-90 transition-transform active:scale-[0.99] shadow-lg shadow-brand-primary/20"
        >
          {isLoggedIn ? "Reserve" : "Login"}
        </button>
        <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!isWhatsappLoading} />
        <p className="mt-3 text-sm text-brand-text-secondary leading-snug">Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment. Rentals Africa reviews and processes refunds.</p>
      </div>
      )}
      {ownListing && (
        <div className="lg:hidden px-4 mt-6"><ManageListingCard status={String(hotel.status || '').toLowerCase()} /></div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {hotel && activeRoomData && (
        <BookModal 
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          roomData={activeRoomData}
          hotelData={hotel}
          checkIn={checkInDate}
          checkOut={checkOutDate}
          isLoggedIn={isLoggedIn}
          onDatesChange={(s, e) => { setCheckInDate(s); setCheckOutDate(e); }}
          onSignIn={() => { setIsBookModalOpen(false); setShowAuthModal?.(true); }}
        />
      )}

    </main>
  );
}