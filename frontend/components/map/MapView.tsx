'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapSensor } from '@/hooks/useSensorsOnMap';
import type { MapStyleValue } from './types';

// Fix for default marker icons (only on client)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const ALMATY_CENTER: [number, number] = [43.2565, 76.9285];

const TILE_LAYERS: Record<
  MapStyleValue,
  { url: string; attribution: string; className?: string }
> = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    className: 'dark-map-tiles',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};

function FitToSensors({ sensors }: { sensors: MapSensor[] }) {
  const map = useMap();

  useEffect(() => {
    if (!sensors.length) {
      map.setView(ALMATY_CENTER, 12);
      return;
    }
    const points: [number, number][] = sensors.map((s) => [s.lat, s.lng]);
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, sensors]);

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => map.invalidateSize(), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

interface MapViewProps {
  sensors: MapSensor[];
  mapStyle?: MapStyleValue;
  children: React.ReactNode;
  className?: string;
}

export function MapView({
  sensors,
  mapStyle = 'standard',
  children,
  className = '',
}: MapViewProps) {
  const tiles = TILE_LAYERS[mapStyle];

  return (
    <div className={`h-full w-full ${className}`} role="application" aria-label="Air quality map">
      <MapContainer
        center={ALMATY_CENTER}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full rounded-b-3xl"
        style={{ height: '100%', width: '100%', zIndex: 1, position: 'relative' }}
      >
        <TileLayer
          key={mapStyle}
          attribution={tiles.attribution}
          url={tiles.url}
          className={tiles.className}
        />
        <FitToSensors sensors={sensors} />
        {children}
      </MapContainer>
    </div>
  );
}
