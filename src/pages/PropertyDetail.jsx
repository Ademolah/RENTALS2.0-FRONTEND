import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Share, Heart, ArrowLeft, Loader2, ChevronLeft, ChevronRight, MapPin, X, Star, Video, Grid3x3, BedDouble, Bath, Users, ShieldCheck, Check } from 'lucide-react';
import BookingWidget from '../components/BookingWidget';
import InteractiveMap from '../components/InteractiveMap';
import { getPropertyById, getProperties } from "../api/properties"; 
import { createPropertyReviewApi } from "../api/reviews";
import { useAuth } from '../context/AuthContext'; 
import { Container, Card, Badge, Button, WhatsAppPill } from '../components/ui';
import { useDocumentMeta } from '../lib/seo';
import { useToast } from '../components/Toast';
import ReviewsSection from '../components/detail/ReviewsSection';
import { StayFacts, DirectionsLink, ManageListingCard, isOwnListing, useSwipe, PhotoCount, coordsOf } from '../components/detail/extras';
import { toggleFavoriteApi } from '../api/user';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuthModal } = useAuth(); 

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProperties, setSimilarProperties] = useState([]);

  // --- REVIEWS STATE ---
  const toast = useToast();
  const [reviewsKey, setReviewsKey] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // --- LIGHTBOX STATE ---
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useDocumentMeta(property?.title, property?.description?.slice(0, 160));

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copy this link', window.location.href); }
  };

  const toggleSave = async () => {
    if (!user) { setShowAuthModal?.(true); return; }
    const prev = saved;
    setSaved(!prev);
    try { await toggleFavoriteApi(property.id || property._id || id); } catch { setSaved(prev); }
  };
  const swipe = useSwipe((dir) => {
    setLightboxIndex((i) => (i === null ? i : (i - dir + (property?.images?.length || 1)) % (property?.images?.length || 1)));
  });
  const mobileScrollRef = useRef(null);
  
  const scrollGallery = (ref, direction) => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      ref.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' });
    }
  };

  // 💡 NEW: Lightbox Navigation Handlers
  const nextLightboxImage = (e) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % property.images.length);
  };
  
  const prevLightboxImage = (e) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  // 💡 NEW: Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

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
          ownerId: dbProp.ownerId?._id || dbProp.ownerId || dbProp.landlordId?._id || dbProp.landlordId,
          checkInTime: dbProp.checkInTime,
          checkOutTime: dbProp.checkOutTime,
          coordinates: dbProp.address?.coordinates || dbProp.location?.coordinates,
          status: dbProp.status,
          amenities: dbProp.amenities || [],
          video: dbProp.video || null, // 💡 NEW: Extract Video URL
          images: dbProp.images?.length > 0 
            ? dbProp.images 
            : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
          isRentalVerified: dbProp.isVerified ?? true,
          isAvailable: dbProp.isAvailable,
          rating: dbProp.rating || 0,
          numReviews: dbProp.numReviews || 0
        });

      } catch (error) {
        console.error("Failed to load property details or reviews:", error);
      } finally {
        setLoading(false);
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
        setReviewsKey((k) => k + 1);
        toast.success('Thank you. Your review was posted.');
        
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="text-base text-brand-text-secondary font-medium">Preparing property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-lg text-brand-text-secondary font-semibold">
        Property not found or is no longer available.
      </div>
    );
  }

  const ownListing = isOwnListing(user, property.ownerId);
  const imgs = property.images;
  const fact = (Icon, label) => (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-brand-accent-soft text-brand-dark font-semibold text-base">
      <Icon className="w-5 h-5 text-brand-primary" /> {label}
    </div>
  );

  return (
    <main className="animate-fade-up pb-24 lg:pb-12">
      <Container className="py-6 relative">

        {/* REVIEW SUBMISSION MODAL */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[1000] bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-elevated relative animate-fade-up">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-brand-dark transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <p className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-3">Guest feedback</p>
                <h3 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-2">Rate your experience</h3>
                <p className="text-base text-brand-text-secondary mb-8">Your feedback helps maintain our world-class standard.</p>

                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-3">Overall rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="focus:outline-none transition-transform active:scale-90 hover:scale-110"
                        >
                          <Star className={`w-10 h-10 ${reviewForm.rating >= star ? 'fill-brand-star text-brand-star' : 'fill-transparent text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-3">Written review</label>
                    <textarea
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share the details of your stay..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-brand-dark focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  {reviewError && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
                      {reviewError}
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmittingReview} className="w-full" size="lg">
                    {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit review'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-up"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
              <div className="text-white font-semibold text-base bg-white/10 px-5 py-2.5 rounded-full">
                {lightboxIndex + 1} / {imgs.length}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                className="text-white hover:bg-white/25 bg-white/10 rounded-full p-3 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative w-full max-w-7xl px-4 flex items-center justify-center" {...swipe}>
              {imgs.length > 1 && (
                <button onClick={prevLightboxImage} className="absolute left-4 md:left-8 p-3.5 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors z-50" aria-label="Previous">
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              <img
                src={imgs[lightboxIndex]}
                alt="Expanded view"
                className="max-h-[85vh] max-w-full object-contain select-none rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {imgs.length > 1 && (
                <button onClick={nextLightboxImage} className="absolute right-4 md:right-8 p-3.5 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors z-50" aria-label="Next">
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TITLE ROW */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-base font-semibold text-brand-text-secondary hover:text-brand-dark mb-5 transition-all group w-fit">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to listings</span>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {property.isRentalVerified && <Badge tone="brand"><ShieldCheck className="w-3.5 h-3.5" /> Verified</Badge>}
              {property.category && <Badge tone="gray">{String(property.category).toLowerCase()}</Badge>}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-brand-dark tracking-tight mb-3 leading-tight">
              {property.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-brand-dark font-semibold">
              {property.numReviews > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-brand-star text-brand-star" />
                  <span>{property.rating} · {property.numReviews} review{property.numReviews !== 1 ? 's' : ''}</span>
                </span>
              )}
              <span className="flex items-center text-brand-text-secondary font-medium">
                <MapPin className="w-5 h-5 mr-1.5 text-brand-primary" /> {property.location}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <WhatsAppPill />
            <Button variant="outline" size="sm" onClick={copyLink}><Share className="w-4 h-4" /> {copied ? 'Link copied' : 'Share'}</Button>
            <Button variant="outline" size="sm" onClick={toggleSave}><Heart className={`w-4 h-4 ${saved ? 'fill-brand-primary text-brand-primary' : ''}`} /> {saved ? 'Saved' : 'Save'}</Button>
          </div>
        </div>

        {/* GALLERY */}
        <div className="mb-10">
          {/* Mobile */}
          <div className="md:hidden relative h-[320px] w-full rounded-2xl overflow-hidden group">
            <div ref={mobileScrollRef} className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {imgs.map((img, idx) => (
                <div key={idx} onClick={() => setLightboxIndex(idx)} className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer">
                  <img src={img} alt={`${property.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 right-4 bg-brand-dark/70 backdrop-blur-md text-white text-sm font-semibold px-3 py-1 rounded-full pointer-events-none">
                    {idx + 1} / {imgs.length}
                  </div>
                </div>
              ))}
            </div>
            {imgs.length > 1 && (
              <>
                <button onClick={() => scrollGallery(mobileScrollRef, 'left')} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 text-brand-dark p-2 rounded-full shadow-md z-10 active:scale-90" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => scrollGallery(mobileScrollRef, 'right')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 text-brand-dark p-2 rounded-full shadow-md z-10 active:scale-90" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
              </>
            )}
          </div>

          {/* Desktop mosaic */}
          <div className="hidden md:block relative">
            {imgs.length === 1 ? (
              <div className="h-[520px] rounded-3xl overflow-hidden cursor-pointer group" onClick={() => setLightboxIndex(0)}>
                <img src={imgs[0]} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" alt="Main view" />
              </div>
            ) : (
              <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[520px] rounded-3xl overflow-hidden">
                <div className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(0)}>
                  <img src={imgs[0]} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" alt="Main view" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`relative group cursor-pointer overflow-hidden ${imgs[i] ? '' : 'bg-brand-accent-soft'}`}
                    onClick={() => imgs[i] && setLightboxIndex(i)}
                  >
                    {imgs[i] && <img src={imgs[i]} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" alt={`View ${i + 1}`} />}
                  </div>
                ))}
              </div>
            )}
            {imgs.length > 1 && <PhotoCount current={1} total={imgs.length} className="absolute top-5 right-5" />}
            {imgs.length > 1 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="absolute bottom-5 right-5 flex items-center gap-2 bg-white hover:bg-gray-50 text-brand-dark font-semibold text-base px-5 py-3 rounded-xl shadow-elevated transition-colors"
              >
                <Grid3x3 className="w-5 h-5" /> Show all {imgs.length} photos
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 relative">

          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">

            {/* Overview */}
            <section className="pb-10 border-b border-gray-100">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-dark mb-5 tracking-tight">Entire property managed by Rentals Africa</h2>
              <div className="flex flex-wrap gap-3 mb-8">
                {fact(Users, `${property.maxGuests || 2} guests`)}
                {property.bedrooms && fact(BedDouble, `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`)}
                {property.bathrooms && fact(Bath, `${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}`)}
              </div>

              {property.description && (
                <div>
                  <h3 className="text-xl font-display font-bold text-brand-dark mb-3">About this space</h3>
                  <p className="text-lg text-brand-text-secondary leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                  {property.propertyId && (
                    <div className="mt-6">
                      <Badge tone="gray">Property ID: {property.propertyId}</Badge>
                    </div>
                  )}
                </div>
              )}
            </section>

            <StayFacts checkInTime={property.checkInTime} checkOutTime={property.checkOutTime} price={property.price} />

            {/* Host card */}
            <section className="pb-10 border-b border-gray-100">
              <Card className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-brand-dark text-white flex items-center justify-center font-display font-bold text-2xl flex-shrink-0">R</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-display font-bold text-brand-dark">Managed by Rentals Africa</p>
                  <p className="text-base text-brand-text-secondary">Your booking is handled end to end by Rentals Africa</p>
                </div>
                <Badge tone="green" className="hidden sm:inline-flex"><ShieldCheck className="w-3.5 h-3.5" /> Verified</Badge>
              </Card>
            </section>

            {/* Video */}
            {property.video && (
              <section className="pb-10 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <Video className="w-6 h-6 text-brand-primary" />
                  <h3 className="text-2xl font-display font-bold text-brand-dark">Cinematic tour</h3>
                </div>
                <div className="w-full relative rounded-3xl overflow-hidden bg-black shadow-card">
                  <video
                    src={property.video}
                    controls
                    preload="metadata"
                    className="w-full h-auto max-h-[480px] object-contain"
                    poster={property.images[0]}
                  />
                </div>
              </section>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="pb-10 border-b border-gray-100">
                <h3 className="text-2xl font-display font-bold text-brand-dark mb-6">What this place offers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary-soft flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-brand-primary" />
                      </div>
                      <span className="text-base font-medium text-brand-dark capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <ReviewsSection
              listingId={property.id}
              fallback={{ rating: property.rating, count: property.numReviews }}
              refreshKey={reviewsKey}
              onWrite={() => {
                if (!user) setShowAuthModal(true);
                else if (user.role === 'USER') setShowReviewModal(true);
                else toast.info('Only guest accounts can submit reviews.');
              }}
            />

            <div className="lg:hidden block">
              {ownListing ? <ManageListingCard status={String(property.status || '').toLowerCase()} /> : <BookingWidget property={property} />}
            </div>

            {/* Map */}
            <section>
              <h3 className="text-2xl font-display font-bold text-brand-dark mb-2">Where you'll be</h3>
              <p className="text-base text-brand-text-secondary mb-3 flex items-center"><MapPin className="w-5 h-5 mr-1.5 text-brand-primary" />{property.location}</p>
              <DirectionsLink {...coordsOf(property.coordinates)} address={property.location} className="mb-5" />
              <div className="w-full h-[420px] rounded-3xl overflow-hidden border border-gray-100 shadow-card">
                <InteractiveMap
                  address={property.address}
                  type="SHORTLET"
                  price={property.price || 0}
                />
              </div>
            </section>

          </div>

          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 relative">
            <div className="sticky top-28 w-full ml-auto">
              {ownListing ? <ManageListingCard status={String(property.status || '').toLowerCase()} /> : <BookingWidget property={property} />}
            </div>
          </div>

        </div>
      </Container>
    </main>
  );
}
