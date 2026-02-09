'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

// Динамический импорт Globe для избежания SSR проблем
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

function getAqiColor(aqi: number) {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

export default function Map3DPage() {
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      authAPI.getMe().then(setUser).catch(() => Cookies.remove('token'));
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/map-data');
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        const pts = json.data.map((item: any, i: number) => {
          if (!item?.location) return null;
          const [lat, lng] = item.location.split(',').map((v: string) => parseFloat(v.trim()));
          if (isNaN(lat) || isNaN(lng)) return null;
          const p = item.parameters || {};
          const aqi = item.value || 0;
          return {
            lat, lng, aqi,
            city: item.site || item.sensorId || 'Sensor',
            country: 'KZ',
            pm1: p.pm1 ?? 0, pm25: p.pm25 ?? aqi, pm10: p.pm10 ?? 0,
            co2: p.co2 ?? 0, co: p.co ?? 0, voc: p.voc ?? 0,
            o3: p.o3 ?? 0, no2: p.no2 ?? 0, ch2o: p.ch2o ?? 0,
            temp: p.temp ?? 0, hum: p.hum ?? 0,
            color: getAqiColor(aqi),
            source: 'sensor',
          };
        }).filter(Boolean);
        setPoints(pts);
      }
    } catch (e) {
      console.error('Failed to load map data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Point camera to Almaty on load
  useEffect(() => {
    if (globeRef.current && points.length > 0) {
      const p = points[0];
      globeRef.current.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.5 }, 1500);
    }
  }, [points.length > 0]);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]" />
      </div>

      <Navigation user={user} onLogout={() => { Cookies.remove('token'); setUser(null); }} />

      <div className="relative z-10 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-white via-green-100 to-cyan-200 bg-clip-text text-transparent">
              3D Карта
            </h1>
            <p className="text-gray-400">Данные датчиков в реальном времени на интерактивном глобусе</p>
          </div>

          <div className="glass-strong rounded-3xl border border-green-500/30 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#1a1a1a] px-6 py-4 border-b border-green-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white font-semibold">{points.length} датчиков на глобусе</span>
              </div>
              <span className="text-gray-500 text-xs">обновление каждые 5 сек</span>
            </div>

            {/* Globe */}
            <div className="relative" style={{ height: '75vh', minHeight: '500px' }}>
              {typeof window !== 'undefined' && points.length > 0 ? (
                <Globe
                  ref={globeRef}
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                  backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                  pointsData={points}
                  pointLat="lat"
                  pointLng="lng"
                  pointAltitude={(d: any) => Math.max(0.02, Math.min(0.4, (d.aqi || 0) / 500))}
                  pointColor="color"
                  pointRadius={0.35}
                  onPointHover={(point: any) => {
                    document.body.style.cursor = point ? 'pointer' : 'default';
                  }}
                  pointLabel={(d: any) => `
                    <div style="background:rgba(0,0,0,0.95);padding:16px;border-radius:12px;border:2px solid ${d.color};color:#fff;font-family:system-ui;min-width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div style="font-size:18px;font-weight:800;color:${d.color}">${d.city}</div>
                        <div style="background:${d.color};color:#000;font-weight:800;padding:4px 10px;border-radius:8px;font-size:16px;">${Math.round(d.aqi)}</div>
                      </div>
                      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
                        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px;text-align:center;">
                          <div style="color:#888;font-size:10px;">PM1</div>
                          <div style="font-weight:700;font-size:16px;">${d.pm1?.toFixed(0) ?? 0}</div>
                          <div style="color:#666;font-size:9px;">µg/m³</div>
                        </div>
                        <div style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);border-radius:8px;padding:8px;text-align:center;">
                          <div style="color:#00ff88;font-size:10px;font-weight:600;">PM2.5</div>
                          <div style="font-weight:700;font-size:16px;">${d.pm25?.toFixed(1) ?? 0}</div>
                          <div style="color:#666;font-size:9px;">µg/m³</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px;text-align:center;">
                          <div style="color:#888;font-size:10px;">PM10</div>
                          <div style="font-weight:700;font-size:16px;">${d.pm10?.toFixed(0) ?? 0}</div>
                          <div style="color:#666;font-size:9px;">µg/m³</div>
                        </div>
                      </div>
                      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;">
                        <div><span style="color:#888;">CO₂</span> <span style="font-weight:600;">${d.co2?.toFixed(0) ?? 0}</span> <span style="color:#666;font-size:9px;">ppm</span></div>
                        <div><span style="color:#888;">CO</span> <span style="font-weight:600;">${d.co?.toFixed(2) ?? 0}</span> <span style="color:#666;font-size:9px;">ppm</span></div>
                        <div><span style="color:#888;">CH₂O</span> <span style="font-weight:600;">${d.ch2o?.toFixed(2) ?? 0}</span> <span style="color:#666;font-size:9px;">ppm</span></div>
                        <div><span style="color:#888;">VOC</span> <span style="font-weight:600;">${d.voc?.toFixed(2) ?? 0}</span> <span style="color:#666;font-size:9px;">ppm</span></div>
                        <div><span style="color:#888;">O₃</span> <span style="font-weight:600;">${d.o3?.toFixed(1) ?? 0}</span> <span style="color:#666;font-size:9px;">ppb</span></div>
                        <div><span style="color:#888;">NO₂</span> <span style="font-weight:600;">${d.no2?.toFixed(1) ?? 0}</span> <span style="color:#666;font-size:9px;">ppb</span></div>
                      </div>
                      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:10px;display:flex;justify-content:space-around;font-size:12px;">
                        <div><span style="color:#f59e0b;">🌡</span> ${d.temp?.toFixed(1) ?? '—'}°C</div>
                        <div><span style="color:#3b82f6;">💧</span> ${d.hum?.toFixed(0) ?? '—'}%</div>
                      </div>
                    </div>
                  `}
                  enablePointerInteraction={true}
                  animateIn={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500/20 border-t-green-500 mx-auto mb-4" />
                    <div className="text-green-400 text-lg font-semibold">Загрузка данных...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#1a1a1a] px-6 py-3 border-t border-green-500/30">
              <div className="flex flex-wrap items-center gap-4 justify-center text-xs text-gray-400">
                {[
                  { color: '#00e400', label: 'Хорошо (0-50)' },
                  { color: '#ffff00', label: 'Умеренно (51-100)' },
                  { color: '#ff7e00', label: 'Нездорово (101-150)' },
                  { color: '#ff0000', label: 'Опасно (151-200)' },
                  { color: '#8f3f97', label: 'Очень опасно (201+)' },
                ].map((item) => (
                  <div key={item.color} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
