'use client';

import { useMemo, useCallback, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslations } from 'next-intl';
import type { MapSensor } from '@/hooks/useSensorsOnMap';
import { getAqiCategory } from '@/lib/map-aqi';

function createMarkerIcon(sensor: MapSensor): L.DivIcon {
  const aqi = sensor.aqi;
  const isPurchased = sensor.isPurchased;
  const category = getAqiCategory(aqi);
  const color = isPurchased ? '#00d8ff' : category.color;
  const size = category.isDangerous ? 50 : isPurchased ? 48 : 42;
  const classes = [
    'marker-aqi-bubble',
    !isPurchased && category.isDangerous ? 'marker-glow marker-danger-pulse' : 'marker-glow',
    isPurchased && 'marker-purchased',
  ].filter(Boolean) as string[];

  const html = `
    <div
      class="${classes.join(' ')}"
      style="--aqi-color: ${color}; --aqi-size: ${size}px;"
      role="img"
      aria-label="Sensor AQI ${aqi}, ${category.label}"
    >
      ${category.isDangerous ? '<span class="marker-badge-danger" aria-hidden></span>' : ''}
      ${isPurchased ? '<span class="marker-badge-purchased" aria-hidden">🛒</span>' : ''}
      <span class="marker-value">${aqi}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function formatLastUpdated(ts?: string): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return ts;
  }
}

interface SensorMarkerProps {
  sensor: MapSensor;
  onClick?: (sensor: MapSensor) => void;
}

function SensorMarkerInner({ sensor, onClick }: SensorMarkerProps) {
  const t = useTranslations('map');
  const tCommon = useTranslations('common');
  const icon = useMemo(() => createMarkerIcon(sensor), [sensor]);
  const position: [number, number] = [sensor.lat, sensor.lng];
  const params = sensor.parameters ?? {};
  const aqi = sensor.aqi;
  const category = getAqiCategory(aqi);
  const aqiLabel = t(`aqi.${category.key}`);
  const eventHandlers = useCallback(() => ({
    click: () => onClick?.(sensor),
  }), [sensor, onClick]);

  if (sensor.isPurchased) {
    return (
      <Marker position={position} icon={icon} eventHandlers={eventHandlers()}>
        <Popup className="custom-popup" aria-label={`Sensor details: ${sensor.name ?? t('purchased')}`}>
          <div className="p-3 sm:p-4 md:p-5 min-w-[240px] sm:min-w-[320px] text-white bg-gradient-to-br from-cyan-900/90 to-blue-800/90 border-2 border-cyan-400/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-lg sm:text-xl text-white">
                {sensor.name ?? t('purchased')}
              </h3>
              <span className="px-2 py-1 bg-cyan-500/30 text-cyan-200 rounded text-xs font-bold border border-cyan-400/50">
                {t('purchasedBadge')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-4">
              {sensor.city ?? 'Unknown'}, {sensor.country ?? 'Unknown'}
            </p>
            <div className="px-4 py-3 rounded-xl text-white font-bold text-center mb-4 shadow-lg bg-cyan-500/20 border border-cyan-400/50">
              <div className="text-3xl font-black mb-1">{aqi}</div>
              <div className="text-sm opacity-90">{tCommon('indexAqi')}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-lg p-3 border border-cyan-400/30">
                <div className="text-xs text-gray-300 mb-1">PM2.5</div>
                <div className="text-lg font-bold text-white">{(params.pm25 ?? 0).toFixed(1)}</div>
                <div className="text-xs text-gray-400">µg/m³</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 border border-cyan-400/30">
                <div className="text-xs text-gray-300 mb-1">PM10</div>
                <div className="text-lg font-bold text-white">{(params.pm10 ?? 0).toFixed(1)}</div>
                <div className="text-xs text-gray-400">µg/m³</div>
              </div>
            </div>
            {(params.co2 ?? params.voc ?? params.co ?? params.o3 ?? params.no2 ?? params.ch2o) != null && (
              <div className="border-t border-cyan-400/30 pt-3 mb-3">
                <div className="text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wide">{tCommon('additionalParams')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {params.co2 != null && (
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-xs text-gray-400">CO₂</div>
                      <div className="text-sm font-bold text-white">{(params.co2 ?? 0).toFixed(1)} ppm</div>
                    </div>
                  )}
                  {params.voc != null && (
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-xs text-gray-400">VOC</div>
                      <div className="text-sm font-bold text-white">{(params.voc ?? 0).toFixed(2)} ppm</div>
                    </div>
                  )}
                  {params.co != null && (
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-xs text-gray-400">CO</div>
                      <div className="text-sm font-bold text-white">{(params.co ?? 0).toFixed(2)} ppm</div>
                    </div>
                  )}
                  {params.o3 != null && (
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-xs text-gray-400">O₃</div>
                      <div className="text-sm font-bold text-white">{(params.o3 ?? 0).toFixed(1)} ppb</div>
                    </div>
                  )}
                  {params.no2 != null && (
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-xs text-gray-400">NO₂</div>
                      <div className="text-sm font-bold text-white">{(params.no2 ?? 0).toFixed(1)} ppb</div>
                    </div>
                  )}
                  {params.ch2o != null && (
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-xs text-gray-400">CH₂O</div>
                      <div className="text-sm font-bold text-white">{(params.ch2o ?? 0).toFixed(3)} ppm</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {sensor.description && (
              <div className="text-xs text-gray-300 border-t border-cyan-400/30 pt-3">
                {sensor.description}
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  }

  const data = sensor.airQualityData;
  const pm1  = data?.current?.pollution?.pm1  ?? params.pm1  ?? 0;
  const pm25 = data?.current?.pollution?.pm25 ?? params.pm25 ?? 0;
  const pm10 = data?.current?.pollution?.pm10 ?? params.pm10 ?? 0;
  const co2  = data?.current?.pollution?.co2  ?? params.co2  ?? 0;
  const co   = data?.current?.pollution?.co   ?? params.co   ?? 0;
  const no2  = data?.current?.pollution?.no2  ?? params.no2  ?? 0;
  const o3   = data?.current?.pollution?.o3   ?? params.o3   ?? 0;
  const voc  = params.voc  ?? 0;
  const ch2o = params.ch2o ?? 0;
  const temp = data?.current?.weather?.tp ?? params.temp ?? null;
  const hum  = data?.current?.weather?.hu ?? params.hum  ?? null;
  const ts   = data?.current?.pollution?.ts;
  const siteName = data?.sensor_data?.site ?? sensor.name ?? data?.city ?? 'Station';
  const locationText = [sensor.city ?? data?.city ?? '', sensor.country ?? data?.country ?? ''].filter(Boolean).join(', ') || '—';

  return (
    <Marker position={position} icon={icon} eventHandlers={eventHandlers()}>
      <Popup className="custom-popup" maxWidth={360} aria-label={`Sensor details: ${siteName}`}>
        <div
          className={`p-4 min-w-[300px] max-w-[360px] text-white rounded-lg ${
            category.isDangerous ? 'bg-gradient-to-br from-red-900/95 to-red-800/95' : 'bg-gradient-to-br from-[#111] to-[#1a1a2e]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-xl text-white">{siteName}</h3>
            {category.isDangerous && (
              <span className="px-2 py-1 bg-red-600 rounded text-xs font-bold animate-pulse">
                {t('dangerBadge')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">{locationText}</p>

          {/* AQI badge */}
          <div
            className="px-4 py-3 rounded-xl font-bold text-center mb-4 shadow-lg"
            style={{ backgroundColor: category.color, color: category.textColor }}
          >
            <div className="text-3xl font-black mb-0.5">{aqi}</div>
            <div className="text-xs opacity-90">{aqiLabel}</div>
          </div>

          {/* Particles section */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-green-400 mb-1.5 uppercase tracking-widest">Частицы</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
                <div className="text-[10px] text-gray-400">PM1</div>
                <div className="text-lg font-black text-white leading-tight">{pm1.toFixed(0)}</div>
                <div className="text-[9px] text-gray-500">µg/m³</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-green-500/20 text-center">
                <div className="text-[10px] text-green-400 font-semibold">PM2.5</div>
                <div className="text-lg font-black text-white leading-tight">{pm25.toFixed(1)}</div>
                <div className="text-[9px] text-gray-500">µg/m³</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
                <div className="text-[10px] text-gray-400">PM10</div>
                <div className="text-lg font-black text-white leading-tight">{pm10.toFixed(0)}</div>
                <div className="text-[9px] text-gray-500">µg/m³</div>
              </div>
            </div>
          </div>

          {/* Gases section */}
          <div className="mb-3 border-t border-white/10 pt-3">
            <div className="text-[10px] font-bold text-cyan-400 mb-1.5 uppercase tracking-widest">Газы</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-400">CO₂</div>
                <div className="text-sm font-bold text-white">{co2.toFixed(0)}</div>
                <div className="text-[9px] text-gray-500">ppm</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-400">CO</div>
                <div className="text-sm font-bold text-white">{co.toFixed(2)}</div>
                <div className="text-[9px] text-gray-500">ppm</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-400">CH₂O</div>
                <div className="text-sm font-bold text-white">{ch2o.toFixed(2)}</div>
                <div className="text-[9px] text-gray-500">ppm</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-400">VOC</div>
                <div className="text-sm font-bold text-white">{voc.toFixed(2)}</div>
                <div className="text-[9px] text-gray-500">ppm</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-400">O₃</div>
                <div className="text-sm font-bold text-white">{o3.toFixed(1)}</div>
                <div className="text-[9px] text-gray-500">ppb</div>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-400">NO₂</div>
                <div className="text-sm font-bold text-white">{no2.toFixed(1)}</div>
                <div className="text-[9px] text-gray-500">ppb</div>
              </div>
            </div>
          </div>

          {/* Environment section */}
          {(temp != null || hum != null) && (
            <div className="border-t border-white/10 pt-3 mb-3">
              <div className="text-[10px] font-bold text-amber-400 mb-1.5 uppercase tracking-widest">Среда</div>
              <div className="grid grid-cols-2 gap-2">
                {temp != null && (
                  <div className="bg-white/5 rounded p-2 text-center">
                    <div className="text-[10px] text-gray-400">Темп.</div>
                    <div className="text-sm font-bold text-white">{Number(temp).toFixed(1)}°C</div>
                  </div>
                )}
                {hum != null && (
                  <div className="bg-white/5 rounded p-2 text-center">
                    <div className="text-[10px] text-gray-400">Влажность</div>
                    <div className="text-sm font-bold text-white">{Number(hum).toFixed(0)}%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-white/10 pt-2 text-[10px] text-gray-500 flex justify-between">
            <span>{sensor.name || siteName}</span>
            <span>{ts ? formatLastUpdated(ts) : 'Live'}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export const SensorMarker = memo(SensorMarkerInner);
