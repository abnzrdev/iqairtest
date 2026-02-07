'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { airQualityAPI, AirQualityData, sensorAPI } from '@/lib/api';
import Navigation from '@/components/Navigation';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

// Динамический импорт Globe для избежания SSR проблем
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function Map3DPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [basePoints, setBasePoints] = useState<any[]>([]);
  const [sensorPoints, setSensorPoints] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [sensorAccessMessage, setSensorAccessMessage] = useState<string | null>(null);
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  // Автоматическое изменение размера Globe при изменении размера окна
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        
        // Принудительно обновляем размер Globe, если доступен
        if (globeRef.current && globeRef.current.controls) {
          // Globe автоматически обновит размер через Three.js renderer
          // Но мы можем принудительно вызвать обновление через изменение key
          setTimeout(() => {
            if (globeRef.current && globeRef.current.renderer) {
              globeRef.current.renderer.setSize(
                globeRef.current.renderer.domElement.parentElement?.clientWidth || window.innerWidth,
                globeRef.current.renderer.domElement.parentElement?.clientHeight || window.innerHeight
              );
            }
          }, 50);
        }
      }
    };

    // Устанавливаем начальные размеры
    updateDimensions();

    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', updateDimensions);

    // Также обновляем размеры при изменении видимости (для случаев изменения размера во время скрытия)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(updateDimensions, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadAirQualityData();
      loadSensorData();
    }
  }, [user]);

  // Перезагружаем данные датчиков периодически, чтобы видеть новые покупки
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      console.log('🔄 Auto-reloading sensor data...');
      loadSensorData();
    }, 5000); // Обновляем каждые 5 секунд
    return () => clearInterval(interval);
  }, [user]);

  // Обновляем данные при фокусе на странице (когда пользователь возвращается с покупки)
  useEffect(() => {
    if (!user) return;
    const handleFocus = () => {
      console.log('🔄 Page focused, reloading sensor data...');
      loadSensorData();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, reloading sensor data...');
        loadSensorData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    if (airQualityData.length > 0) {
      console.log('📊 Processing air quality data:', airQualityData.length, 'points');
      const formattedPoints = airQualityData.map((data, index) => {
        // GeoJSON формат: coordinates: [lon, lat]
        const coords = data.location?.coordinates || [76.8512, 43.2220];
        const lon = coords[0];
        const lat = coords[1];
        const aqi = data.current?.pollution?.aqius || 0;
        
        // Проверка валидности координат
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
          console.warn(`Invalid coordinates for point ${index}:`, data);
          return null;
        }
        
        // Определяем цвет в зависимости от AQI
        const getColor = (aqi: number) => {
          if (aqi <= 50) return '#00e400'; // Зеленый - хорошо
          if (aqi <= 100) return '#ffff00'; // Желтый - умеренно
          if (aqi <= 150) return '#ff7e00'; // Оранжевый - нездорово для чувствительных
          if (aqi <= 200) return '#ff0000'; // Красный - нездорово
          if (aqi <= 300) return '#8f3f97'; // Фиолетовый - очень нездорово
          return '#7e0023'; // Темно-красный - опасно
        };

        const point = {
          lat: lat,
          lng: lon,
          aqi: aqi,
          city: data.city || 'Unknown',
          country: data.country || 'Unknown',
          pm25: data.current?.pollution?.pm25 || 0,
          pm10: data.current?.pollution?.pm10 || 0,
          color: getColor(aqi),
        };
        
        if (index < 5) {
          console.log(`Point ${index}:`, { lat, lon, city: point.city, aqi });
        }
        
        return point;
      }).filter((p): p is NonNullable<typeof p> => p !== null);
      
      console.log('✅ Formatted points:', formattedPoints.length);
      if (formattedPoints.length > 0) {
        console.log('First point:', formattedPoints[0]);
      }
      setBasePoints(formattedPoints);
    } else {
      console.log('⚠️ No air quality data available');
      setBasePoints([]);
    }
  }, [airQualityData]);

  useEffect(() => {
    // объединяем базовые точки и платные датчики, на которые у пользователя есть доступ
    setPoints([...basePoints, ...sensorPoints]);
  }, [basePoints, sensorPoints]);

  const checkAuth = async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (error) {
        Cookies.remove('token');
      }
    }
    setLoading(false);
  };

  const loadAirQualityData = async () => {
    if (!user) return;
    try {
      console.log('🔄 Loading air quality data...');
      const data = await airQualityAPI.getAllAirQuality();
      console.log('✅ Loaded data:', data.length, 'points');
      if (data.length > 0) {
        console.log('First point sample:', data[0]);
      }
      setAirQualityData(data);
    } catch (error) {
      console.error('❌ Error loading air quality data:', error);
    }
  };

  const loadSensorData = async () => {
    if (!user) return;
    try {
      console.log('🔄 Loading sensor data...');
      const data = await sensorAPI.mapSensors();
      console.log('📊 Received sensor data:', data?.length || 0, 'sensors');
      if (data && data.length > 0) {
        const formatted = data
          .filter((d: any) => d.lat && d.lng)
          .map((d: any) => ({
            lat: d.lat,
            lng: d.lng,
            aqi: d.aqi || 0,
            city: d.name || d.city || 'Sensor',
            country: d.country || '—',
            pm25: d.parameters?.pm25 || 0,
            pm10: d.parameters?.pm10 || 0,
            co2: d.parameters?.co2 || 0,
            voc: d.parameters?.voc || 0,
            co: d.parameters?.co || 0,
            o3: d.parameters?.o3 || 0,
            no2: d.parameters?.no2 || 0,
            ch2o: d.parameters?.ch2o || 0,
            color: d.color || '#00d8ff',
            source: d.source || 'sensor',
          }));
        console.log('✅ Formatted sensor points:', formatted.length);
        setSensorPoints(formatted);
        setSensorAccessMessage(null);
      } else {
        console.log('⚠️ No sensor data received');
        setSensorPoints([]);
        setSensorAccessMessage('Купите датчик или попросите доступ, чтобы увидеть его на карте');
      }
    } catch (error: any) {
      console.error('❌ Error loading sensors:', error);
      setSensorPoints([]);
      setSensorAccessMessage('Купите датчик или попросите доступ, чтобы увидеть его на карте');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-red-400 text-xl">Пожалуйста, войдите в систему</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]"></div>
      </div>

      <Navigation user={user} onLogout={() => { Cookies.remove('token'); setUser(null); }} />

      <div className="relative z-10 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-green-100 to-cyan-200 bg-clip-text text-transparent">
              3D Карта Загрязнения Воздуха
            </h1>
            <p className="text-gray-300 text-lg">
              Интерактивная 3D карта мира с данными о качестве воздуха в реальном времени
            </p>
          </div>

          <div className="glass-strong rounded-3xl border border-green-500/30 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#1a1a1a] px-6 py-4 border-b border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold">Мировая карта загрязнения</span>
                </div>
                <div className="text-green-400 font-bold">
                  {points.length} точек на глобусе
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Данных с API: {airQualityData.length} | Обработано: {points.length} | Датчики: {sensorPoints.length}
                </div>
              </div>
              {sensorAccessMessage && (
                <div className="text-yellow-400 text-sm mt-2">
                  {sensorAccessMessage}
                </div>
              )}
            </div>

            <div className="relative" style={{ height: '80vh', minHeight: '600px' }}>
              {typeof window !== 'undefined' && points.length > 0 ? (
                <Globe
                  ref={globeRef}
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                  backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                  pointsData={points}
                  pointLat="lat"
                  pointLng="lng"
                  pointAltitude={(d: any) => {
                    const aqi = d.aqi || 0;
                    return Math.max(0.01, Math.min(0.3, aqi / 1000));
                  }}
                  pointColor="color"
                  pointRadius={0.2}
                  onPointHover={(point: any, prevPoint: any) => {
                    if (point) {
                      document.body.style.cursor = 'pointer';
                    } else {
                      document.body.style.cursor = 'default';
                    }
                  }}
                  pointLabel={(d: any) => {
                    const isSensor = d.source === 'sensor';
                    return `
                    <div style="
                      background: rgba(0,0,0,0.95);
                      padding: 14px;
                      border-radius: 10px;
                      border: 2px solid ${d.color || '#00e400'};
                      color: white;
                      font-family: Arial, sans-serif;
                      min-width: 280px;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    ">
                      <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px; color: ${d.color || '#00e400'}">
                        ${d.city || 'Unknown'}
                      </div>
                      <div style="color: #aaa; font-size: 13px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${isSensor ? '🛒 Платный датчик (куплен)' : (d.country || 'Unknown')}
                      </div>
                      <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: #888; font-size: 13px;">Индекс AQI:</span>
                        <span style="color: ${d.color || '#00e400'}; font-weight: bold; margin-left: 10px; font-size: 18px;">${Math.round(d.aqi || 0)}</span>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <span style="color: #888; font-size: 12px;">PM2.5:</span>
                        <span style="color: white; margin-left: 10px; font-weight: 500;">${(d.pm25 || 0).toFixed(1)} µg/m³</span>
                      </div>
                      <div style="margin-bottom: 6px;">
                        <span style="color: #888; font-size: 12px;">PM10:</span>
                        <span style="color: white; margin-left: 10px; font-weight: 500;">${(d.pm10 || 0).toFixed(1)} µg/m³</span>
                      </div>
                      ${isSensor ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,216,255,0.3);">
                          <div style="color: #00d8ff; font-weight: 600; font-size: 12px; margin-bottom: 8px; text-transform: uppercase;">Дополнительные параметры:</div>
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                            ${d.co2 ? `<div><span style="color: #888;">CO₂:</span> <span style="color: white; font-weight: 500;">${(d.co2 || 0).toFixed(1)} ppm</span></div>` : ''}
                            ${d.voc ? `<div><span style="color: #888;">VOC:</span> <span style="color: white; font-weight: 500;">${(d.voc || 0).toFixed(2)} ppm</span></div>` : ''}
                            ${d.co ? `<div><span style="color: #888;">CO:</span> <span style="color: white; font-weight: 500;">${(d.co || 0).toFixed(2)} ppm</span></div>` : ''}
                            ${d.o3 ? `<div><span style="color: #888;">O₃:</span> <span style="color: white; font-weight: 500;">${(d.o3 || 0).toFixed(1)} ppb</span></div>` : ''}
                            ${d.no2 ? `<div><span style="color: #888;">NO₂:</span> <span style="color: white; font-weight: 500;">${(d.no2 || 0).toFixed(1)} ppb</span></div>` : ''}
                            ${d.ch2o ? `<div><span style="color: #888;">CH₂O:</span> <span style="color: white; font-weight: 500;">${(d.ch2o || 0).toFixed(3)} ppm</span></div>` : ''}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `;
                  }}
                  enablePointerInteraction={true}
                  animateIn={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-green-400 text-xl mb-2">
                      {points.length === 0 && airQualityData.length === 0 ? 'Загрузка данных...' : 'Ожидание данных...'}
                    </div>
                    <div className="text-gray-400 text-sm">Точек данных: {points.length}</div>
                    <div className="text-gray-400 text-sm">Загружено с API: {airQualityData.length}</div>
                    {airQualityData.length > 0 && points.length === 0 && (
                      <div className="text-yellow-400 text-sm mt-2">
                        Данные загружены, но не обработаны. Проверьте консоль.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Легенда */}
            <div className="bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#1a1a1a] px-6 py-4 border-t border-green-500/30">
              <div className="flex flex-wrap items-center gap-6 justify-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00e400' }}></div>
                  <span className="text-gray-300 text-sm">Хорошо (0-50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffff00' }}></div>
                  <span className="text-gray-300 text-sm">Умеренно (51-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff7e00' }}></div>
                  <span className="text-gray-300 text-sm">Нездорово для чувствительных (101-150)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff0000' }}></div>
                  <span className="text-gray-300 text-sm">Нездорово (151-200)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#8f3f97' }}></div>
                  <span className="text-gray-300 text-sm">Очень нездорово (201-300)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7e0023' }}></div>
                  <span className="text-gray-300 text-sm">Опасно (300+)</span>
                </div>
              </div>
              <div className="text-center text-gray-400 text-sm">
                💡 Перетащите карту для вращения • Используйте колесико мыши для масштабирования • Высота столбцов показывает уровень загрязнения
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
