import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDocumentMeta } from '../lib/seo';
import { useCarListing } from '../components/detail/car/useCarListing';
import { useCarBooking } from '../components/detail/car/useCarBooking';
import { DEFAULT_CAR_IMAGE, carTitle } from '../components/detail/car/carHelpers';
import CarHeader from '../components/detail/car/CarHeader';
import CarGallery from '../components/detail/car/CarGallery';
import CarLightbox from '../components/detail/car/CarLightbox';
import CarSpecs from '../components/detail/car/CarSpecs';
import CarBookingPanel from '../components/detail/car/CarBookingPanel';
import SimilarCars from '../components/detail/car/SimilarCars';

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setShowAuthModal } = useAuth();

  const { car, loading, similarCars } = useCarListing(id);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const images = car?.images?.length > 0 ? car.images : [DEFAULT_CAR_IMAGE];
  const booking = useCarBooking({ car, images, user, setShowAuthModal, navigate });

  useDocumentMeta(car ? carTitle(car) : '', car?.description?.slice(0, 160));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-brand-text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
        <p className="font-medium">Preparing vehicle details...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-brand-dark">Vehicle not found</h2>
      </div>
    );
  }

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 relative">
      {lightboxIndex !== null && (
        <CarLightbox images={images} index={lightboxIndex} onChange={setLightboxIndex} />
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-base font-semibold text-brand-text-secondary hover:text-brand-dark transition-colors mb-6 group w-fit"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <CarHeader car={car} />
      <CarGallery images={images} onOpen={setLightboxIndex} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        <CarSpecs car={car} poster={images[0]} />
        <CarBookingPanel car={car} booking={booking} />
      </div>

      <SimilarCars cars={similarCars} city={car.location?.city} />
    </main>
  );
}
