import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Dummy nearby properties to populate the map pins
const nearbyProperties = [
  { id: 1, lat: 6.4540, lng: 3.4390, price: 150000, isSelected: true },
  { id: 2, lat: 6.4560, lng: 3.4410, price: 125000, isSelected: false },
  { id: 3, lat: 6.4520, lng: 3.4350, price: 180000, isSelected: false },
  { id: 4, lat: 6.4580, lng: 3.4380, price: 95000, isSelected: false },
];

// Function to generate the custom price pin HTML
const createPricePin = (price, isSelected) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div class="flex items-center justify-center px-3 py-1.5 rounded-full font-bold text-sm shadow-md transition-transform hover:scale-110 ${
        isSelected 
          ? 'bg-brand-dark text-white z-50 scale-110' 
          : 'bg-white text-brand-dark border border-gray-200 hover:border-gray-400'
      }">
        ₦${(price / 1000).toFixed(0)}k
      </div>
    `,
    iconSize: null,
    iconAnchor: [25, 15],
  });
};

export default function InteractiveMap() {
  const center = [6.4540, 3.4390]; // Centered on Ikoyi/VI Lagos

  return (
    <div className="w-full h-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative z-0">
      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
          // Note: Using CartoDB Voyager tiles for a cleaner, modern look than standard OSM
        />
        
        {nearbyProperties.map((prop) => (
          <Marker 
            key={prop.id} 
            position={[prop.lat, prop.lng]} 
            icon={createPricePin(prop.price, prop.isSelected)}
          >
            <Popup className="rounded-xl">
              <div className="font-sans">
                <img 
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80" 
                  alt="Preview" 
                  className="w-full h-24 object-cover rounded-t-lg mb-2" 
                />
                <div className="px-2 pb-2">
                  <div className="font-bold text-brand-dark">₦{prop.price.toLocaleString()} / night</div>
                  <div className="text-xs text-gray-500">Luxury Suite</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}