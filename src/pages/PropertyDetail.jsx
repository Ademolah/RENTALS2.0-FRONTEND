import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Share, Heart, Medal, ArrowLeft, Loader2, ChevronLeft, ChevronRight, MapPin, X, Star, MessageSquare } from 'lucide-react';
import BookingWidget from '../components/BookingWidget';
import InteractiveMap from '../components/InteractiveMap';
import { getPropertyById, getProperties } from "../api/properties"; 
import { getPropertyReviewsApi, createPropertyReviewApi } from "../api/reviews";
import { useAuth } from '../context/AuthContext'; // Adjust path as needed

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuthModal } = useAuth(); // Assuming useAuth exposes the current user and auth modal trigger

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProperties, setSimilarProperties] = useState([]);

  // --- REVIEWS STATE ---
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // --- LIGHTBOX STATE ---
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const mobileScrollRef = useRef(null);
  const desktopScrollRef = useRef(null);
  
  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      ref.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchDetailsAndReviews() {
      try {
        setLoading(true);
        // 1. Fetch Property
        const propResponse = await getPropertyById(id);
        const dbProp = propResponse?.data?.property || propResponse?.property || propResponse;
        
        setProperty({
          id: dbProp._id,
          propertyId: dbProp.propertyId,
          title: dbProp.title,
          location: `${dbProp.address?.street}, ${dbProp.address?.city}`,
          address: dbProp.address,
          price: dbProp.pricePerNight,
          description: dbProp.description,
          maxGuests: dbProp.maxGuests,
          bedrooms: dbProp.bedrooms,
          bathrooms: dbProp.bathrooms,
          category: dbProp.category,
          amenities: dbProp.amenities || [],
          images: dbProp.images?.length > 0 
            ? dbProp.images 
            : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
          isRentalVerified: dbProp.isVerified ?? true,
          isAvailable: dbProp.isAvailable,
          rating: dbProp.rating || 0,
          numReviews: dbProp.numReviews || 0
        });

        // 2. Fetch Reviews
        setReviewsLoading(true);
        const revResponse = await getPropertyReviewsApi(dbProp._id);
        if (revResponse?.success) {
          setReviews(revResponse.reviews);
        }
      } catch (error) {
        console.error("Failed to load property details or reviews:", error);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    }
    if (id) fetchDetailsAndReviews();
  }, [id]);

  useEffect(() => {
    async function fetchSimilar() {
      if (!property?.address?.city) return;
      try {
        const res = await getProperties(); 
        const allProps = res?.data?.properties || res?.properties || res?.data || [];
        
        const similar = allProps.filter(p => 
          p._id !== property.id && 
          p.address?.city === property.address?.city &&
          p.category !== 'HOTEL' 
        ).slice(0, 4); 
        
        setSimilarProperties(similar);
      } catch (err) {
        console.error("Failed to load similar properties", err);
      }
    }
    
    if (property) fetchSimilar();
  }, [property]);

  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setLightboxIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));

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
      const res = await createPropertyReviewApi(property.id, reviewForm, user.token);
      
      if (res.success) {
        // Optimistically update UI
        setReviews([{
          _id: res.review._id,
          rating: res.review.rating,
          comment: res.review.comment,
          createdAt: res.review.createdAt,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture
          }
        }, ...reviews]);
        
        setProperty(prev => ({
          ...prev,
          rating: res.updatedPropertyStats.rating,
          numReviews: res.updatedPropertyStats.numReviews
        }));

        setShowReviewModal(false);
        setReviewForm({ rating: 0, comment: '' });
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="text-gray-500 font-medium tracking-wide">Preparing property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 text-gray-500 font-bold">
        Property not found or is no longer available.
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 relative">
      
      {/* REVIEW SUBMISSION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-4 w-0.5 bg-brand-primary"></div>
                <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-[0.25em]">
                  Guest Feedback
                </span>
              </div>
              
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Rate your experience</h3>
              <p className="text-sm font-medium text-gray-500 mb-8">Your feedback helps maintain our world-class standard.</p>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Overall Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none transition-transform active:scale-90"
                      >
                        <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-gray-900 text-gray-900' : 'fill-transparent text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Written Review</label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share the details of your stay..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-none"
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
                  className="w-full py-4 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-bold tracking-wider uppercase transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX CODE REMAINS UNCHANGED */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          {/* ... Lightbox content from previous implementation ... */}
          <button onClick={() => setLightboxIndex(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors"><X className="w-8 h-8" /></button>
          <img src={property.images[lightboxIndex]} alt="Expanded view" className="max-h-[90vh] max-w-[90vw] object-contain select-none" />
        </div>
      )}

      <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-all group w-fit">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to listings</span>
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            {property.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-900 font-bold">
            {property.numReviews > 0 && (
              <span className="flex items-center space-x-1 text-gray-900">
                <Star className="w-4 h-4 fill-gray-900" />
                <span>{property.rating} · {property.numReviews} review{property.numReviews !== 1 ? 's' : ''}</span>
              </span>
            )}
            <span className="underline cursor-pointer flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {property.location}</span>
          </div>
        </div>
        
        <div className="flex space-x-3 text-sm font-bold">
          <button className="flex items-center space-x-2 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Share className="w-4 h-4" /> <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Heart className="w-4 h-4" /> <span>Save</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* FULL GALLERY RESTORED */}
          <div className="mb-4">
            
            {/* MOBILE VIEW */}
            <div className="md:hidden relative h-[350px] w-full rounded-2xl overflow-hidden group shadow-sm">
              <div ref={mobileScrollRef} className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {property.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setLightboxIndex(idx)}
                    className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer"
                  >
                    <img src={img} alt={`${property.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 right-4 bg-gray-900/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
                      {idx + 1} / {property.images.length}
                    </div>
                  </div>
                ))}
              </div>

              {property.images.length > 1 && (
                <>
                  <button onClick={() => scrollGallery(mobileScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => scrollGallery(mobileScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-90"><ChevronRight className="w-5 h-5" /></button>
                </>
              )}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block h-[500px] rounded-2xl overflow-hidden shadow-sm">
              {property.images.length === 1 && (
                <div 
                  className="w-full h-full relative cursor-pointer"
                  onClick={() => setLightboxIndex(0)}
                >
                  <img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity duration-300 rounded-2xl" alt="Main View" />
                </div>
              )}
              {property.images.length === 2 && (
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div 
                    className="w-full h-full relative cursor-pointer"
                    onClick={() => setLightboxIndex(0)}
                  >
                    <img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="View 1"/>
                  </div>
                  <div 
                    className="w-full h-full relative cursor-pointer"
                    onClick={() => setLightboxIndex(1)}
                  >
                    <img src={property.images[1]} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" alt="View 2"/>
                  </div>
                </div>
              )}
              {property.images.length >= 3 && (
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div 
                    className="w-full h-full relative group cursor-pointer"
                    onClick={() => setLightboxIndex(0)}
                  >
                    <img src={property.images[0]} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300" alt="Main View" />
                  </div>
                  <div className="grid grid-rows-2 gap-2 h-full">
                    <div 
                      className="w-full h-full relative group cursor-pointer"
                      onClick={() => setLightboxIndex(1)}
                    >
                      <img src={property.images[1]} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300" alt="Interior 1" />
                    </div>
                    <div className="w-full h-full relative group">
                      <div ref={desktopScrollRef} className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {property.images.slice(2).map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setLightboxIndex(idx + 2)}
                            className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer"
                          >
                            <img src={img} className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity duration-300" alt={`Interior ${idx + 2}`} />
                            {property.images.length > 3 && (
                              <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full pointer-events-none shadow-lg">
                                {idx + 1} / {property.images.length - 2}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {property.images.length > 3 && (
                        <>
                          <button onClick={() => scrollGallery(desktopScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => scrollGallery(desktopScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg z-10 transition-transform active:scale-90 opacity-0 group-hover:opacity-100 duration-200"><ChevronRight className="w-5 h-5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Entire property hosted by Rentals</h2>
            
            {/* Unicode characters removed, replaced with clean ASCII pipes */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-gray-600 font-medium mb-6">
              <span>{property.maxGuests || 2} guests</span>
              {property.bedrooms && (
                <><span>|</span><span>{property.bedrooms} bedroom{property.bedrooms > 1 ? 's' : ''}</span></>
              )}
              {property.bathrooms && (
                <><span>|</span><span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span></>
              )}
            </div>

            {property.description && (
              <div className="mt-8 mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About this space</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
                
                {property.propertyId && (
                  <div className="mt-6 flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
                      Property ID: {property.propertyId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">What this place offers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 bg-gray-900"></div>
                      <span className="text-gray-700 font-medium text-sm capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* REVIEWS SECTION */}
          <div className="border-b border-gray-200 pb-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Star className="w-6 h-6 fill-gray-900 text-gray-900" />
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {property.numReviews === 0 ? 'No reviews yet' : `${property.rating} · ${property.numReviews} review${property.numReviews !== 1 ? 's' : ''}`}
                </h3>
              </div>
              
              <button 
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else if (user.role === 'USER') {
                    setShowReviewModal(true);
                  } else {
                    alert('Only guest accounts can submit reviews.');
                  }
                }}
                className="px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                Write a Review
              </button>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center space-x-2 text-gray-500 font-medium text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading guest feedback...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">Be the first to review</h4>
                <p className="text-sm font-medium text-gray-500 max-w-sm">Share your experience to help other travelers make informed decisions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {reviews.map((review) => (
                  <div key={review._id} className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                        {review.user?.profilePicture ? (
                          <img src={review.user.profilePicture} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg uppercase">
                            {review.user?.firstName?.charAt(0) || 'G'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{review.user?.firstName}</div>
                        <div className="text-xs font-medium text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${review.rating >= star ? 'fill-gray-900 text-gray-900' : 'fill-transparent text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:hidden block">
            <BookingWidget property={property} />
          </div>

          <div className="pt-4 pb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Where you'll be</h3>
            <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
              <InteractiveMap 
                address={property.address} 
                type="SHORTLET"
                price={property.price || 0}
              />
            </div>
          </div>

        </div>

        <div className="hidden lg:block lg:col-span-5 relative">
          <div className="sticky top-28 w-full max-w-md ml-auto">
            <BookingWidget property={property} />
          </div>
        </div>

      </div>

    </main>
  );
}