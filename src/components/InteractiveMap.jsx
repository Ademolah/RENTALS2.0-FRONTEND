import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- DYNAMIC PIN GENERATORS ---
const createHotelPin = () => {
  return L.divIcon({
    className: 'custom-hotel-pin',
    html: `
      <div class="w-8 h-8 bg-[#D32F2F] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const createPricePin = (price, isSelected) => {
  return L.divIcon({
    className: 'custom-price-pin',
    html: `
      <div class="flex items-center justify-center px-3 py-1.5 rounded-full font-bold text-sm shadow-md transition-all duration-300 ${
        isSelected 
          ? 'bg-gray-900 text-white z-50 scale-110 shadow-xl' 
          : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400 hover:scale-105'
      }">
        ₦${(price / 1000).toFixed(0)}k
      </div>
    `,
    iconSize: null,
    iconAnchor: [25, 15],
  });
};

// React-Leaflet doesn't auto-recenter when coordinates change, this forces it.
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// --- MAIN COMPONENT ---
export default function InteractiveMap({ 
  address, 
  type = 'HOTEL', // 'HOTEL' or 'SHORTLET'
  price = 0,
  nearbyProperties = [] 
}) {
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!address || !address.city) {
        setIsLoading(false);
        setGeoError(true);
        return;
      }

      try {
        setIsLoading(true);
        // Ping free OpenStreetMap Nominatim API to convert address text to coordinates
        const query = `${address.street || ''}, ${address.city}, ${address.state || ''}, Nigeria`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          // Fallback to city center if specific street isn't found
          const cityQuery = `${address.city}, ${address.state || ''}, Nigeria`;
          const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}`);
          const cityData = await cityResponse.json();
          
          if (cityData && cityData.length > 0) {
             setCoordinates([parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)]);
          } else {
             setGeoError(true);
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setGeoError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoordinates();
  }, [address]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
         <Loader2 className="w-8 h-8 animate-spin text-gray-900 mb-2" />
         <span className="text-sm font-medium animate-pulse">Detecting location...</span>
      </div>
    );
  }

  if (geoError || !coordinates) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
         <span className="text-sm font-medium">Map location unavailable for this address.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative z-0">
      <MapContainer 
        center={coordinates} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
      >
        {/* COMPLETELY FREE TILE LAYER - NO API KEY REQUIRED */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        <MapUpdater center={coordinates} />
        
        {/* MAIN TARGET PIN */}
        <Marker 
          position={coordinates} 
          icon={type === 'HOTEL' ? createHotelPin() : createPricePin(price, true)}
        >
          {type === 'HOTEL' && (
            <Popup className="rounded-xl border-none shadow-xl">
              <div className="font-sans font-bold text-gray-900 text-center px-4 py-2">
                Exact Location
              </div>
            </Popup>
          )}
        </Marker>

        {/* NEARBY SHORTLET PINS (Skipped for Hotels) */}
        {type === 'SHORTLET' && nearbyProperties.map((prop) => {
          // You would implement similar geocoding logic for nearby properties if they also lack coordinates
          return null; 
        })}
      </MapContainer>
    </div>
  );
}