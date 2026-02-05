'use client';

import { AirQualityData } from '@/lib/api';

interface AirQualityCardProps {
  data: AirQualityData;
}

export default function AirQualityCard({ data }: AirQualityCardProps) {
  const aqi = data.current.pollution.aqius;
  const weather = data.current.weather;

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <div className="glass-strong rounded-xl sm:rounded-2xl border border-green-500/20 overflow-hidden shadow-2xl hover-lift relative">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
      <div className="relative bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] px-4 sm:px-6 py-3 sm:py-4 border-b border-green-500/20">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Индекс качества воздуха
        </h2>
      </div>
      <div className="p-4 sm:p-6 relative">
        <div className={`${getAQIColor(aqi)} text-white rounded-3xl p-10 mb-6 text-center shadow-2xl pulse-glow relative overflow-hidden group`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_70%)]"></div>
          <div className="relative z-10">
            <div className="text-8xl md:text-9xl font-black mb-3 drop-shadow-2xl tracking-tight" style={{ textShadow: '0 0 30px rgba(0,0,0,0.5)' }}>{aqi}</div>
            <div className="text-2xl font-bold opacity-95 tracking-wide uppercase">{getAQILabel(aqi)}</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="space-y-4">
          {/* Данные сенсора */}
          {data.sensor_data && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <p className="text-xs text-green-400 font-medium uppercase tracking-wide">Датчик</p>
              </div>
              <p className="font-bold text-white text-lg">{data.sensor_data.device_id}</p>
              <p className="text-xs text-gray-400 mt-1">{data.sensor_data.site}</p>
            </div>
          )}

          {/* Частицы PM */}
          <div className="pt-4 border-t border-green-500/20">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">●</span>
              Частицы (PM)
            </h3>
            <div className="space-y-2 text-sm">
              {data.current.pollution.pm1 !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-gray-300">PM1.0</span>
                  <span className="font-bold text-white text-lg">{data.current.pollution.pm1.toFixed(1)} <span className="text-xs text-gray-500">µg/m³</span></span>
                </div>
              )}
              {data.current.pollution.pm25 !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors bg-green-500/5 border border-green-500/20">
                  <span className="text-gray-300">PM2.5</span>
                  <span className="font-bold text-green-400 text-lg">{data.current.pollution.pm25.toFixed(1)} <span className="text-xs text-gray-500">µg/m³</span></span>
                </div>
              )}
              {data.current.pollution.pm10 !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-gray-300">PM10</span>
                  <span className="font-bold text-white text-lg">{data.current.pollution.pm10.toFixed(1)} <span className="text-xs text-gray-500">µg/m³</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Газы */}
          {(data.current.pollution.co2 !== undefined || 
            data.current.pollution.co !== undefined || 
            data.current.pollution.o3 !== undefined || 
            data.current.pollution.no2 !== undefined ||
            data.current.pollution.voc !== undefined ||
            data.current.pollution.ch2o !== undefined) && (
            <div className="pt-4 border-t border-green-500/20">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-emerald-400">●</span>
                Газы
              </h3>
              <div className="space-y-2 text-sm">
                {data.current.pollution.co2 !== undefined && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-gray-300">CO₂</span>
                    <span className="font-bold text-white">{data.current.pollution.co2} <span className="text-xs text-gray-500">ppm</span></span>
                  </div>
                )}
                {data.current.pollution.co !== undefined && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-gray-300">CO</span>
                    <span className="font-bold text-white">{data.current.pollution.co} <span className="text-xs text-gray-500">ppm</span></span>
                  </div>
                )}
                {data.current.pollution.o3 !== undefined && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-gray-300">O₃</span>
                    <span className="font-bold text-white">{data.current.pollution.o3} <span className="text-xs text-gray-500">ppb</span></span>
                  </div>
                )}
                {data.current.pollution.no2 !== undefined && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-gray-300">NO₂</span>
                    <span className="font-bold text-white">{data.current.pollution.no2} <span className="text-xs text-gray-500">ppb</span></span>
                  </div>
                )}
                {data.current.pollution.voc !== undefined && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-gray-300">VOC</span>
                    <span className="font-bold text-white">{data.current.pollution.voc} <span className="text-xs text-gray-500">ppm</span></span>
                  </div>
                )}
                {data.current.pollution.ch2o !== undefined && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-gray-300">CH₂O</span>
                    <span className="font-bold text-white">{data.current.pollution.ch2o} <span className="text-xs text-gray-500">ppm</span></span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Погодные условия */}
          <div className="pt-4 border-t border-green-500/20">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">●</span>
              Погодные условия
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-gray-300">Температура</span>
                <span className="font-bold text-white text-lg">{weather.tp}°C</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-gray-300">Влажность</span>
                <span className="font-bold text-white text-lg">{weather.hu}%</span>
              </div>
              {weather.pr > 0 && (
                <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-gray-300">Давление</span>
                  <span className="font-bold text-white text-lg">{weather.pr} <span className="text-xs text-gray-500">hPa</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Местоположение */}
          <div className="pt-4 border-t border-green-500/20">
            <div className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
              <p className="font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-blue-400">📍</span>
                Местоположение
              </p>
              <p className="text-gray-300">{data.city}, {data.state}</p>
              <p className="text-gray-400 text-sm">{data.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

