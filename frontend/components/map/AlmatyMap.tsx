'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

export default function AlmatyMap() {
  const position: [number, number] = useMemo(() => [43.2565, 76.9285], []);

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">
        Интерактивная карта качества воздуха
      </h2>
      <div className="h-[400px] sm:h-[500px] md:h-[600px] rounded-xl sm:rounded-2xl overflow-hidden">
        <MapContainer
          center={position}
          zoom={12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    </div>
  );
}
