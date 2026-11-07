import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Bed, Users } from 'lucide-react';

export default function SimilarProperties({ properties }) {
  if (!properties || properties.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Similar places nearby
        </h2>
      </div>

      {/* 
        Mobile: Horizontal Native Scroll (Snap & Scrollbar Hidden)
        Desktop: Standard 4-Column Grid 
      */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pb-8 md:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] -mx-4 px-4 md:mx-0 md:px-0">
        
        {properties.map((prop) => (
          <Link 
            key={prop._id || prop.id} 
            to={`/property/${prop._id || prop.id}`} 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex-shrink-0 w-[85vw] sm:w-[300px] md:w-auto snap-start cursor-pointer transition-all flex flex-col"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 mb-4">
              <img
                src={prop.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                alt={prop.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Floating Badge (Optional) */}
              <div className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full transition-colors shadow-sm">
                <svg className="w-5 h-5 text-white stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            {/* Text Details */}
            <div className="flex justify-between items-start mb-1 gap-2">
              <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-brand-primary transition-colors">
                {prop.title}
              </h3>
              <div className="flex items-center space-x-1 shrink-0 bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                <span className="font-bold text-gray-900">{prop.rating || 'New'}</span>
              </div>
            </div>

            <div className="flex items-center text-gray-500 text-sm font-medium mb-2 truncate">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
              <span className="truncate">{prop.address?.city || 'Location unavailable'}</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-500 text-xs font-medium mb-3 mt-auto">
              <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" />{prop.maxGuests || 2} Guests</span>
              <span className="w-1 h-1 rounded-full bg-gray-200"></span>
              <span className="flex items-center"><Bed className="w-3.5 h-3.5 mr-1" />{prop.bedrooms || 1} Bed</span>
            </div>

            {/* Price */}
            <div className="text-gray-900">
              <span className="font-black text-lg tracking-tight">₦{(prop.pricePerNight || prop.price || 0).toLocaleString()}</span>
              <span className="text-gray-500 text-sm font-medium"> / night</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}