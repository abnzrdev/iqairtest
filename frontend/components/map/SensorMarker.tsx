'use client';

import { useMemo, memo } from 'react';
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
}

function SensorMarkerInner({ sensor }: SensorMarkerProps) {
  const t = useTranslations('map');
  const tCommon = useTranslations('common');
  const icon = useMemo(() => createMarkerIcon(sensor), [sensor]);
  const position: [number, number] = [sensor.lat, sensor.lng];
  const params = sensor.parameters ?? {};
  const aqi = sensor.aqi;
  const category = getAqiCategory(aqi);
  const aqiLabel = t(`aqi.${category.key}`);

  if (sensor.isPurchased) {
    return (
      <Marker position={position} icon={icon}>
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
  const pm25 = data?.current?.pollution?.pm25 ?? 0;
  const pm10 = data?.current?.pollution?.pm10 ?? 0;
  const co2 = data?.current?.pollution?.co2 ?? 0;
  const no2 = data?.current?.pollution?.no2 ?? 0;
  const ts = data?.current?.pollution?.ts;
  const siteName = data?.sensor_data?.site ?? sensor.name ?? data?.city ?? 'Station';
  const locationText = [data?.state ?? sensor.state ?? '', data?.country ?? sensor.country ?? ''].filter(Boolean).join(', ') || '—';

  return (
    <Marker position={position} icon={icon}>
      <Popup className="custom-popup" aria-label={`Sensor details: ${siteName}`}>
        <div
          className={`p-3 sm:p-4 md:p-5 min-w-[240px] sm:min-w-[280px] text-white rounded-lg ${
            category.isDangerous ? 'bg-gradient-to-br from-red-900/90 to-red-800/90' : 'bg-[#1a1a1a]'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
            <h3 className="font-black text-lg sm:text-xl text-white">{siteName}</h3>
            {category.isDangerous && (
              <span className="px-2 py-1 bg-red-600 rounded text-xs font-bold animate-pulse">
                {t('dangerBadge')}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">{locationText}</p>
          <div
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-white font-bold text-center mb-3 sm:mb-4 shadow-lg"
            style={{ backgroundColor: category.color }}
          >
            <div className="text-2xl sm:text-3xl font-black mb-1">{aqi}</div>
            <div className="text-xs sm:text-sm opacity-90">{aqiLabel}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">PM2.5</div>
              <div className="text-base sm:text-lg font-bold text-white">{pm25.toFixed(1)}</div>
              <div className="text-xs text-gray-500">µg/m³</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">PM10</div>
              <div className="text-base sm:text-lg font-bold text-white">{pm10.toFixed(1)}</div>
              <div className="text-xs text-gray-500">µg/m³</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">CO₂</div>
              <div className="text-base sm:text-lg font-bold text-white">{co2}</div>
              <div className="text-xs text-gray-500">ppm</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">NO₂</div>
              <div className="text-base sm:text-lg font-bold text-white">{no2.toFixed(1)}</div>
              <div className="text-xs text-gray-500">ppb</div>
            </div>
          </div>
          {data?.sensor_data && (
            <div className="mb-2 sm:mb-3 text-xs border-t border-white/10 pt-2 sm:pt-3">
              <p className="text-gray-300 mb-1">
                <span className="font-semibold text-white">{tCommon('deviceId')}:</span> {data.sensor_data.device_id}
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-white">{tCommon('site')}:</span> {data.sensor_data.site}
              </p>
            </div>
          )}
          {data?.current?.weather && (
            <div className="text-xs sm:text-sm border-t border-white/10 pt-2 sm:pt-3 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
              <div>
                <span className="text-gray-400">{tCommon('temperature')}:</span>
                <span className="text-white font-semibold ml-2">{data.current.weather.tp}°C</span>
              </div>
              <div>
                <span className="text-gray-400">{tCommon('humidity')}:</span>
                <span className="text-white font-semibold ml-2">{data.current.weather.hu}%</span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 border-t border-white/10 pt-2 mt-2">
            {tCommon('lastUpdated')}: {formatLastUpdated(ts)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export const SensorMarker = memo(SensorMarkerInner);
