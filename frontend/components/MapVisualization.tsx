'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AirQualityData } from '@/lib/api';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Координаты Алматы
const ALMATY_CENTER: [number, number] = [43.2220, 76.8512];

interface MapVisualizationProps {
  airQualityData: AirQualityData | null;
  allAirQualityData?: AirQualityData[];
  purchasedSensors?: any[]; // Купленные датчики
  onLocationSelect?: (lat: number, lon: number) => void;
}

function MapUpdater({ allData, sensors }: { allData: AirQualityData[], sensors?: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    const allPoints: [number, number][] = [];
    
    // Добавляем точки из air quality data
    if (allData && allData.length > 0) {
      const bounds = allData
        .filter(d => d.location?.coordinates)
        .map(d => {
          const [lon, lat] = d.location.coordinates;
          return [lat, lon] as [number, number];
        });
      allPoints.push(...bounds);
    }
    
    // Добавляем точки из купленных датчиков
    if (sensors && sensors.length > 0) {
      const sensorBounds = sensors
        .filter(s => s.lat && s.lng)
        .map(s => [s.lat, s.lng] as [number, number]);
      allPoints.push(...sensorBounds);
    }
    
    if (allPoints.length > 0) {
      // Если одна точка, центрируем на ней
      if (allPoints.length === 1) {
        map.setView(allPoints[0], 13);
      } else {
        // Если несколько точек, показываем все
        const latlngs = allPoints.map(b => L.latLng(b[0], b[1]));
        const boundsGroup = L.latLngBounds(latlngs);
        map.fitBounds(boundsGroup, { padding: [20, 20] });
      }
    } else {
      map.setView(ALMATY_CENTER, 13);
    }
  }, [allData, sensors, map]);
  
  // Автоматическое изменение размера карты при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  
  return null;
}

// Создаем кастомную иконку маркера с цветом AQI
function createCustomIcon(aqi: number, isDangerous: boolean = false, isPurchased: boolean = false) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  // Для купленных датчиков используем голубой цвет
  const color = isPurchased ? '#00d8ff' : getAQIColor(aqi);
  const size = isDangerous ? 50 : (isPurchased ? 48 : 42);
  const borderSize = isDangerous ? 4 : (isPurchased ? 4 : 3);
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderSize}px solid #0a0a0a;
        box-shadow: 
          0 0 ${isDangerous ? '30' : '20'}px ${color}${isDangerous ? '80' : '60'},
          0 0 ${isDangerous ? '60' : '40'}px ${color}${isDangerous ? '50' : '30'},
          0 4px 12px rgba(0,0,0,0.6),
          inset 0 1px 0 rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        font-size: ${isDangerous ? '16' : '14'}px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        ${isDangerous ? 'animation: danger-pulse 1.5s ease-in-out infinite;' : ''}
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: ${color};
          opacity: ${isDangerous ? '0.5' : '0.3'};
          filter: blur(${isDangerous ? '12' : '8'}px);
          animation: pulse-ring ${isDangerous ? '1.5' : '2'}s ease-out infinite;
        "></div>
        ${aqi}
        ${isDangerous ? '<div style="position: absolute; top: -8px; right: -8px; width: 12px; height: 12px; background: #ff0000; border-radius: 50%; border: 2px solid white; animation: blink 1s infinite;"></div>' : ''}
        ${isPurchased ? '<div style="position: absolute; top: -10px; left: -10px; width: 20px; height: 20px; background: #00d8ff; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">🛒</div>' : ''}
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: ${isDangerous ? '0.5' : '0.3'}; }
          50% { transform: scale(${isDangerous ? '1.5' : '1.3'}); opacity: ${isDangerous ? '0.2' : '0.1'}; }
          100% { transform: scale(${isDangerous ? '1.8' : '1.5'}); opacity: 0; }
        }
        @keyframes danger-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapVisualization({ airQualityData, allAirQualityData, purchasedSensors = [] }: MapVisualizationProps) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return 'Хорошо';
    if (aqi <= 100) return 'Умеренно';
    if (aqi <= 150) return 'Нездорово для чувствительных групп';
    if (aqi <= 200) return 'Нездорово';
    if (aqi <= 300) return 'Очень нездорово';
    return 'Опасно';
  };

  // Используем все данные, если они есть, иначе используем текущие данные
  const dataToShow = allAirQualityData && allAirQualityData.length > 0 
    ? allAirQualityData 
    : (airQualityData ? [airQualityData] : []);
  
  // Мемоизируем отфильтрованные датчики для оптимизации
  const validPurchasedSensors = useMemo(() => {
    if (!purchasedSensors || !Array.isArray(purchasedSensors)) return [];
    const valid = purchasedSensors.filter(s => s.lat && s.lng);
    console.log(`📍 MapVisualization: ${valid.length} valid purchased sensors out of ${purchasedSensors.length} total`);
    return valid;
  }, [purchasedSensors]);
  
  console.log(`MapVisualization: displaying ${dataToShow.length} air quality points and ${validPurchasedSensors.length} purchased sensors`);

  return (
    <MapContainer
      center={ALMATY_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%', zIndex: 1, position: 'relative' }}
      scrollWheelZoom={true}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-map-tiles"
      />
      <MapUpdater allData={dataToShow} sensors={validPurchasedSensors} />
      
      {/* Отображаем купленные датчики */}
      {validPurchasedSensors.length > 0 && (
        <>
          {validPurchasedSensors.map((sensor, index) => {
            if (!sensor.lat || !sensor.lng) {
              console.warn(`⚠️ Sensor ${sensor.id || index} missing coordinates:`, sensor);
              return null;
            }
            
            const markerPosition: [number, number] = [sensor.lat, sensor.lng];
            const aqi = sensor.aqi || 0;
            const params = sensor.parameters || {};
            const uniqueKey = `purchased-sensor-${sensor.id || `idx-${index}`}-${sensor.lat}-${sensor.lng}`;
            
            return (
              <Marker 
                key={uniqueKey} 
                position={markerPosition} 
                icon={createCustomIcon(aqi, false, true)}
              >
            <Popup className="custom-popup">
              <div className="p-3 sm:p-4 md:p-5 min-w-[240px] sm:min-w-[320px] text-white bg-gradient-to-br from-cyan-900/90 to-blue-800/90 border-2 border-cyan-400/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-lg sm:text-xl text-white">
                    {sensor.name || 'Платный датчик'}
                  </h3>
                  <div className="px-2 py-1 bg-cyan-500/30 text-cyan-200 rounded text-xs font-bold border border-cyan-400/50">
                    🛒 КУПЛЕНО
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mb-4">
                  {sensor.city || 'Unknown'}, {sensor.country || 'Unknown'}
                </p>
                
                {/* AQI Badge */}
                <div className="px-4 py-3 rounded-xl text-white font-bold text-center mb-4 shadow-lg bg-cyan-500/20 border border-cyan-400/50">
                  <div className="text-3xl font-black mb-1">{aqi}</div>
                  <div className="text-sm opacity-90">Индекс AQI</div>
                </div>
                
                {/* Основные параметры */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/10 rounded-lg p-3 border border-cyan-400/30">
                    <div className="text-xs text-gray-300 mb-1">PM2.5</div>
                    <div className="text-lg font-bold text-white">{(params.pm25 || 0).toFixed(1)}</div>
                    <div className="text-xs text-gray-400">µg/m³</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 border border-cyan-400/30">
                    <div className="text-xs text-gray-300 mb-1">PM10</div>
                    <div className="text-lg font-bold text-white">{(params.pm10 || 0).toFixed(1)}</div>
                    <div className="text-xs text-gray-400">µg/m³</div>
                  </div>
                </div>
                
                {/* Дополнительные параметры для купленных датчиков */}
                <div className="border-t border-cyan-400/30 pt-3 mb-3">
                  <div className="text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wide">Дополнительные параметры:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {params.co2 && (
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-xs text-gray-400">CO₂</div>
                        <div className="text-sm font-bold text-white">{(params.co2 || 0).toFixed(1)} ppm</div>
                      </div>
                    )}
                    {params.voc && (
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-xs text-gray-400">VOC</div>
                        <div className="text-sm font-bold text-white">{(params.voc || 0).toFixed(2)} ppm</div>
                      </div>
                    )}
                    {params.co && (
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-xs text-gray-400">CO</div>
                        <div className="text-sm font-bold text-white">{(params.co || 0).toFixed(2)} ppm</div>
                      </div>
                    )}
                    {params.o3 && (
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-xs text-gray-400">O₃</div>
                        <div className="text-sm font-bold text-white">{(params.o3 || 0).toFixed(1)} ppb</div>
                      </div>
                    )}
                    {params.no2 && (
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-xs text-gray-400">NO₂</div>
                        <div className="text-sm font-bold text-white">{(params.no2 || 0).toFixed(1)} ppb</div>
                      </div>
                    )}
                    {params.ch2o && (
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-xs text-gray-400">CH₂O</div>
                        <div className="text-sm font-bold text-white">{(params.ch2o || 0).toFixed(3)} ppm</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {sensor.description && (
                  <div className="text-xs text-gray-300 border-t border-cyan-400/30 pt-3">
                    {sensor.description}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
            );
          })}
        </>
      )}
      
      {/* Отображаем обычные точки качества воздуха */}
      {dataToShow.map((data, index) => {
        const markerPosition: [number, number] = data?.location?.coordinates
          ? [data.location.coordinates[1], data.location.coordinates[0]]
          : ALMATY_CENTER;

        const aqi = data?.current?.pollution?.aqius || 0;
        const color = getAQIColor(aqi);

        // Получаем 4 основных параметра для отображения
        const pm25 = data.current?.pollution?.pm25 || 0;
        const pm10 = data.current?.pollution?.pm10 || 0;
        const co2 = data.current?.pollution?.co2 || 0;
        const no2 = data.current?.pollution?.no2 || 0;
        
        // Определяем уровень опасности
        const dangerLevel = data.sensor_data?.danger_level || 
          (aqi <= 50 ? 'safe' : 
           aqi <= 100 ? 'moderate' : 
           aqi <= 150 ? 'unhealthy_sensitive' : 
           aqi <= 200 ? 'unhealthy' : 
           aqi <= 300 ? 'very_unhealthy' : 'hazardous');
        
        const getDangerLabel = (level: string) => {
          switch(level) {
            case 'safe': return 'Безопасно';
            case 'moderate': return 'Умеренно';
            case 'unhealthy_sensitive': return 'Нездорово для чувствительных';
            case 'unhealthy': return 'Нездорово';
            case 'very_unhealthy': return 'Очень нездорово';
            case 'hazardous': return 'ОПАСНО ДЛЯ ЖИЗНИ';
            default: return 'Неизвестно';
          }
        };
        
        const isDangerous = dangerLevel === 'very_unhealthy' || dangerLevel === 'hazardous';

        return (
          <Marker key={index} position={markerPosition} icon={createCustomIcon(aqi, isDangerous)}>
            <Popup className="custom-popup">
              <div className={`p-3 sm:p-4 md:p-5 min-w-[240px] sm:min-w-[280px] text-white ${isDangerous ? 'bg-gradient-to-br from-red-900/90 to-red-800/90' : 'bg-[#1a1a1a]'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                  <h3 className="font-black text-lg sm:text-xl text-white">
                    {data.sensor_data?.site || data.city || 'Алматы'}
                  </h3>
                  {isDangerous && (
                    <div className="px-2 py-1 bg-red-600 rounded text-xs font-bold animate-pulse">
                      ⚠️ ОПАСНО
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
                  {data.state || 'Алматы'}, {data.country || 'Казахстан'}
                </p>
                
                {/* AQI Badge */}
                <div
                  className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-white font-bold text-center mb-3 sm:mb-4 shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  <div className="text-2xl sm:text-3xl font-black mb-1">{aqi}</div>
                  <div className="text-xs sm:text-sm opacity-90">{getAQILabel(aqi)}</div>
                  <div className="text-xs mt-1 opacity-75">{getDangerLabel(dangerLevel)}</div>
                </div>
                
                {/* 4 основных параметра */}
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
                
                {/* Информация о датчике */}
                {data.sensor_data && (
                  <div className="mb-2 sm:mb-3 text-xs border-t border-white/10 pt-2 sm:pt-3">
                    <p className="text-gray-300 mb-1">
                      <span className="font-semibold text-white">Датчик:</span> {data.sensor_data.device_id}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">Место:</span> {data.sensor_data.site}
                    </p>
                  </div>
                )}
                
                {/* Погода */}
                <div className="text-xs sm:text-sm border-t border-white/10 pt-2 sm:pt-3 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                  <div>
                    <span className="text-gray-400">Температура:</span>
                    <span className="text-white font-semibold ml-2">{data.current.weather.tp}°C</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Влажность:</span>
                    <span className="text-white font-semibold ml-2">{data.current.weather.hu}%</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
