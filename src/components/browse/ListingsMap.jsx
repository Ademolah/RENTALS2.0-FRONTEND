import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Star, MapPin, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { pinFor, shortPrice } from './mapPins';
import { itemPrice, naira } from './meta';

const pill = (label, on) =>
  L.divIcon({
    className: '',
    html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;padding:6px 12px;border-radius:999px;font:700 14px 'DM Sans',sans-serif;box-shadow:0 4px 12px rgba(0,13,46,.25);border:2px solid #fff;background:${on ? '#F25F5C' : '#000D2E'};color:#fff;">${label}</div>`,
    iconSize: [0, 0],
  });

function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [60, 60], maxZoom: 15 });
  }, [points, map]);
  return null;
}

export default function ListingsMap({ items, hrefFor, titleFor, imageFor, subtitleFor }) {
  const [selectedId, setSelectedId] = useState(null);

  const pins = useMemo(
    () => items
      .map((item) => {
        const p = pinFor(item);
        return p ? { id: String(item._id || item.id), item, ...p } : null;
      })
      .filter(Boolean),
    [items]
  );

  const selected = pins.find((p) => p.id === selectedId);
  const approx = pins.filter((p) => p.approximate).length;
  const unplaced = items.length - pins.length;

  if (!pins.length) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-gray-50 py-24 text-center">
        <MapPin className="w-8 h-8 text-brand-text-muted mx-auto mb-3" />
        <p className="text-lg font-semibold text-brand-dark">No locations to show on the map</p>
        <p className="text-base text-brand-text-secondary mt-1">Switch back to the list to see these listings.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-card h-[560px] md:h-[640px]">
        <MapContainer center={[pins[0].lat, pins[0].lng]} zoom={12} zoomControl={false} scrollWheelZoom className="w-full h-full z-0">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="bottomright" />
          <Fit points={pins} />
          {pins.map((p) => (
            <Marker
              key={p.id + (p.id === selectedId ? 'on' : '')}
              position={[p.lat, p.lng]}
              icon={pill(shortPrice(itemPrice(p.item)), p.id === selectedId)}
              zIndexOffset={p.id === selectedId ? 1000 : 0}
              eventHandlers={{ click: () => setSelectedId(p.id) }}
            />
          ))}
        </MapContainer>

        {selected && (
          <Link
            to={hrefFor(selected.item)}
            className="absolute z-[500] left-4 right-4 bottom-4 md:right-auto md:w-[380px] flex gap-4 bg-white rounded-2xl p-3 shadow-elevated"
          >
            <img src={imageFor(selected.item)} alt="" className="w-28 h-24 rounded-xl object-cover shrink-0 bg-gray-100" />
            <div className="min-w-0 flex-1 py-1">
              <p className="text-lg font-display font-bold text-brand-dark truncate">{titleFor(selected.item)}</p>
              <p className="text-base text-brand-text-secondary truncate">{subtitleFor(selected.item)}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-display font-bold text-brand-dark">{naira(itemPrice(selected.item))}</span>
                {Number(selected.item.rating) > 0 && (
                  <span className="inline-flex items-center gap-1 text-base font-semibold">
                    <Star className="w-4 h-4 fill-brand-star text-brand-star" /> {Number(selected.item.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}
      </div>

      {(approx > 0 || unplaced > 0) && (
        <p className="mt-3 flex items-start gap-2 text-base text-brand-text-secondary">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            {approx > 0 && `${approx} listing${approx > 1 ? 's are' : ' is'} pinned near ${approx > 1 ? 'their' : 'its'} neighbourhood, not at the exact address. `}
            {unplaced > 0 && `${unplaced} listing${unplaced > 1 ? 's have' : ' has'} no location and ${unplaced > 1 ? 'are' : 'is'} only shown in the list.`}
          </span>
        </p>
      )}
    </div>
  );
}
