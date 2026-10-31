import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, Star, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// --- PRICE FORMATTING ENGINE ---
const formatMapPrice = (rawPrice) => {
  const price = Number(rawPrice) || 0;
  if (price <= 0) return '₦0';
  
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `₦${(price / 1000).toFixed(0)}k`;
  }
  return `₦${price.toLocaleString()}`;
};

// --- AIRBNB-STYLE DYNAMIC PRICE PILL PIN ---
const createAirbnbPricePin = (price, isSelected = false) => {
  const formattedPrice = formatMapPrice(price);

  return L.divIcon({
    className: 'custom-airbnb-marker', 
    html: `
      <div class="airbnb-price-pill ${isSelected ? 'selected' : ''}">
        <span class="price-text">${formattedPrice}</span>
      </div>
    `,
    iconSize: [60, 32],
    iconAnchor: [30, 16],
    popupAnchor: [0, -18]
  });
};

// --- HOTEL / VIP VENUE PIN ---
const createHotelPin = (isSelected = false) => {
  return L.divIcon({
    className: 'custom-airbnb-marker',
    html: `
      <div class="hotel-pin-badge ${isSelected ? 'selected' : ''}">
        <div class="inner-dot"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// --- MAP RE-CENTERING CONTROLLER ---
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

export default function InteractiveMap({ 
  address, 
  type = 'SHORTLET', 
  price = 0,
  title = '',
  image = '',
  rating = 5.0,
  reviewsCount = 0,
  assetId = '',
  nearbyProperties = [] 
}) {
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geoError, setGeoError] = useState(false);
  const [activePinId, setActivePinId] = useState(null);

  // --- GEOCODING RESOLVER ---
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!address || (!address.city && !address.street)) {
        setIsLoading(false);
        setGeoError(true);
        return;
      }

      if (address.coordinates?.lat && address.coordinates?.lng) {
        setCoordinates([address.coordinates.lat, address.coordinates.lng]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setGeoError(false);

        const query = `${address.street || ''}, ${address.city || ''}, ${address.state || ''}, Nigeria`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          const cityQuery = `${address.city || 'Lagos'}, ${address.state || 'Lagos'}, Nigeria`;
          const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}`);
          const cityData = await cityResponse.json();
          
          if (cityData && cityData.length > 0) {
            setCoordinates([parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)]);
          } else {
            setCoordinates([6.5244, 3.3792]);
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setCoordinates([6.5244, 3.3792]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoordinates();
  }, [address]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-gray-500 bg-gray-100 rounded-3xl border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
        <span className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Rendering Map...</span>
      </div>
    );
  }

  if (geoError || !coordinates) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400 bg-gray-100 rounded-3xl border border-gray-200 p-6 text-center">
        <MapPin className="w-8 h-8 mb-2 text-gray-300" />
        <span className="text-base font-semibold text-brand-text-secondary">Map location preview unavailable for this address.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] rounded-3xl overflow-hidden shadow-sm border border-gray-200 relative z-0 group">
      
      <style>{`
        /* 💡 THE FIX: This filter transforms standard OSM into the muted Airbnb vector look */
        .leaflet-tile-pane {
          filter: saturate(0.35) brightness(1.08) contrast(0.95) sepia(0.08) !important;
        }

        /* Reset Leaflet marker wrapper */
        .custom-airbnb-marker {
          background: transparent !important;
          border: none !important;
        }

        /* Airbnb Price Badge Styling */
        .airbnb-price-pill {
          background-color: #ffffff;
          color: #222222;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 800;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 20px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          user-select: none;
        }

        .airbnb-price-pill:hover {
          transform: scale(1.08);
          z-index: 999;
          box-shadow: 0 6px 16px rgba(0,0,0,0.22);
        }

        .airbnb-price-pill.selected {
          background-color: #111827 !important;
          color: #ffffff !important;
          transform: scale(1.12);
          z-index: 1000;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        /* Hotel Badge Pin */
        .hotel-pin-badge {
          width: 32px;
          height: 32px;
          background-color: #111827;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .hotel-pin-badge .inner-dot {
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          border-radius: 50%;
        }

        /* Leaflet Popup Airbnb Card Reset */
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 18px !important;
          overflow: hidden !important;
          box-shadow: 0 12px 28px rgba(0,0,0,0.18) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          background: rgba(0,0,0,0.5) !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          width: 22px !important;
          height: 22px !important;
          font-size: 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          backdrop-filter: blur(4px);
        }
      `}</style>

      <MapContainer 
        center={coordinates} 
        zoom={14} 
        zoomControl={false}
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
      >
        {/* 100% FREE TILE LAYER - NO API KEY REQUIRED */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <MapUpdater center={coordinates} />
        
        {/* MAIN LISTING PIN */}
        <Marker 
          position={coordinates} 
          icon={type === 'HOTEL' ? createHotelPin(true) : createAirbnbPricePin(price, activePinId === assetId)}
          eventHandlers={{
            click: () => setActivePinId(assetId)
          }}
        >
          {/* AIRBNB POPUP CARD */}
          <Popup className="airbnb-popup">
            <div className="w-[240px] bg-white overflow-hidden font-sans">
              {image && (
                <div className="relative h-32 w-full bg-gray-100 overflow-hidden">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold text-white uppercase tracking-wider">
                    {type}
                  </div>
                </div>
              )}
              
              <div className="p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-brand-dark text-base truncate max-w-[160px]">
                    {title || 'Selected Property'}
                  </span>
                  {rating > 0 && (
                    <div className="flex items-center text-sm font-bold text-brand-dark">
                      <Star className="w-3 h-3 fill-gray-900 mr-0.5" />
                      <span>{Number(rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-brand-text-secondary font-medium truncate mb-2">
                  {address.street ? `${address.street}, ` : ''}{address.city}
                </p>

                <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="font-bold text-brand-dark text-base">{formatMapPrice(price)}</span>
                    <span className="text-xs text-brand-text-secondary font-medium"> / night</span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* NEARBY PROPERTY PINS (For search map grids) */}
        {nearbyProperties.map((item) => {
          if (!item.location?.coordinates?.lat || !item.location?.coordinates?.lng) return null;
          
          const itemPos = [item.location.coordinates.lat, item.location.coordinates.lng];
          const isSelected = activePinId === item._id;

          return (
            <Marker 
              key={item._id}
              position={itemPos}
              icon={createAirbnbPricePin(item.pricePerNight || item.pricePer12Hours || item.startingPrice, isSelected)}
              eventHandlers={{
                click: () => setActivePinId(item._id)
              }}
            >
              <Popup className="airbnb-popup">
                <div className="w-[220px] bg-white overflow-hidden font-sans">
                  {item.images?.[0] && (
                    <div className="relative h-28 w-full bg-gray-100">
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-bold text-base text-brand-dark truncate mb-1">{item.title}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="font-bold text-brand-dark text-base">
                        {formatMapPrice(item.pricePerNight || item.pricePer12Hours || item.startingPrice)}
                      </div>
                      <Link 
                        to={`/${({ car: 'cars', hotel: 'hotel', vip: 'vip' })[type.toLowerCase()] || 'property'}/${item._id}`}
                        className="text-xs font-bold text-brand-primary hover:underline flex items-center"
                      >
                        View <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}