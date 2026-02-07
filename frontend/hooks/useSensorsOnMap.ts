
'use client';

import React from 'react';

import { useEffect, useState, useCallback } from 'react';
import { airQualityAPI, sensorAPI, AirQualityData } from '@/lib/api';

/**
 * Unified map sensor type for both air quality API and purchased sensors.
 * Used by MapView to render markers dynamically.
 */
export interface MapSensor {
  id: string;
  lat: number;
  lng: number;
  aqi: number;
  isPurchased: boolean;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  parameters?: Record<string, number>;
  /** Raw air quality data if from IQAir API */
  airQualityData?: AirQualityData;
}

export interface UseSensorsOnMapResult {
  sensors: MapSensor[];
  /** Raw air quality data (from IQAir API) for sidebar/stats */
  allAirQuality: AirQualityData[];
  loading: boolean;
  /** Alias for loading (e.g. for consistency with isLoading naming) */
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Converts AirQualityData to MapSensor
 */
function airQualityToMapSensor(data: AirQualityData, index: number): MapSensor | null {
  const coords = data?.location?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lon, lat] = coords;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  const aqi = data?.current?.pollution?.aqius ?? 0;
  return {
    id: `aq-${data.city}-${data.state}-${index}`,
    lat,
    lng: lon,
    aqi,
    isPurchased: false,
    name: data?.sensor_data?.site ?? data?.city ?? 'Станция',
    city: data?.city,
    state: data?.state,
    country: data?.country,
    airQualityData: data,
  };
}

/**
 * Converts purchased sensor from map API to MapSensor
 */
function purchasedSensorToMapSensor(s: any, index: number): MapSensor | null {
  const lat = s?.lat ?? s?.location?.coordinates?.[1];
  const lng = s?.lng ?? s?.location?.coordinates?.[0];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return {
    id: `sensor-${s?.id ?? index}`,
    lat,
    lng,
    aqi: s?.aqi ?? 0,
    isPurchased: true,
    name: s?.name ?? 'Платный датчик',
    city: s?.city,
    country: s?.country,
    description: s?.description,
    parameters: s?.parameters ?? {},
  };
}

/**
 * Hook that fetches sensor data for the map from:
 * - airQualityAPI.getAllAirQuality() (IQAir stations)
 * - sensorAPI.mapSensors() (purchased sensors, when user is logged in)
 *
 * Supports periodic refetch so the map updates when database changes.
 */
export function useSensorsOnMap(
  options: {
    /** If set, fetches purchased sensors (requires auth) */
    userId?: string | null;
    /** Refetch interval in ms. Set to 0 or undefined to disable */
    refetchIntervalMs?: number;
  } = {}
): UseSensorsOnMapResult {
  const { userId, refetchIntervalMs = 5000 } = options;
  const [sensors, setSensors] = useState<MapSensor[]>([]);
  const [allAirQuality, setAllAirQuality] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only log error once per error occurrence
  const lastErrorRef = React.useRef<string | null>(null);
  const consecutiveFailures = React.useRef(0);
  const refetch = useCallback(async () => {
    // Only show loading on the very first fetch (no data yet)
    if (sensors.length === 0 && allAirQuality.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const [airQualityData, purchasedSensors] = await Promise.all([
        airQualityAPI.getAllAirQuality(),
        userId ? sensorAPI.mapSensors().catch(() => []) : Promise.resolve([]),
      ]);

      const airSensors: MapSensor[] = [];
      (airQualityData || []).forEach((aq, i) => {
        const s = airQualityToMapSensor(aq, i);
        if (s) airSensors.push(s);
      });

      const purchasedList = Array.isArray(purchasedSensors) ? purchasedSensors : [];
      const validPurchased = purchasedList.filter((s: any) => s?.lat && s?.lng);
      const sensorItems: MapSensor[] = validPurchased.map((s, i) =>
        purchasedSensorToMapSensor(s, i)
      ).filter((s): s is MapSensor => s !== null);

      setAllAirQuality(airQualityData || []);
      setSensors([...airSensors, ...sensorItems]);
      lastErrorRef.current = null;
      consecutiveFailures.current = 0;
    } catch (e: any) {
      const errMsg = e?.message ?? 'Failed to load sensors';
      setError(errMsg);
      // Keep stale data on the map instead of blanking it
      consecutiveFailures.current += 1;
      if (lastErrorRef.current !== errMsg) {
        console.warn('[SensorsOnMap]', errMsg);
        lastErrorRef.current = errMsg;
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (refetchIntervalMs <= 0) return;
    // Back off on repeated failures: double the interval per failure, cap at 60 s
    const backoff = Math.min(
      refetchIntervalMs * Math.pow(2, consecutiveFailures.current),
      60_000
    );
    const interval = setInterval(refetch, backoff);
    return () => clearInterval(interval);
  }, [refetchIntervalMs, refetch, error]);

  return { sensors, allAirQuality, loading, isLoading: loading, error, refetch };
}
