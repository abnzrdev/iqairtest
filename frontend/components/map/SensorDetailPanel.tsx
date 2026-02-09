'use client';

import type { MapSensor } from '@/hooks/useSensorsOnMap';
import { getAqiCategory } from '@/lib/map-aqi';

interface SensorDetailPanelProps {
  sensor: MapSensor;
}

function ParamCard({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center border ${accent ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-black text-white leading-tight">{value}</div>
      <div className="text-[10px] text-gray-500">{unit}</div>
    </div>
  );
}

export function SensorDetailPanel({ sensor }: SensorDetailPanelProps) {
  const params = sensor.parameters ?? {};
  const aqi = sensor.aqi;
  const category = getAqiCategory(aqi);

  const pm1  = params.pm1  ?? 0;
  const pm25 = params.pm25 ?? 0;
  const pm10 = params.pm10 ?? 0;
  const co2  = params.co2  ?? 0;
  const co   = params.co   ?? 0;
  const no2  = params.no2  ?? 0;
  const o3   = params.o3   ?? 0;
  const voc  = params.voc  ?? 0;
  const ch2o = params.ch2o ?? 0;
  const temp = params.temp ?? null;
  const hum  = params.hum  ?? null;

  return (
    <div className="glass-strong rounded-3xl border border-green-500/30 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#1a1a1a] px-5 py-4 border-b border-green-500/20">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-black text-white truncate">{sensor.name || 'Sensor'}</h3>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-300 text-[10px] font-bold tracking-wider uppercase">Live</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{sensor.city ?? ''}{sensor.country ? `, ${sensor.country}` : ''}</p>
      </div>

      <div className="p-5 space-y-5">
        {/* AQI */}
        <div
          className="rounded-2xl p-4 text-center shadow-lg"
          style={{ backgroundColor: category.color, color: category.textColor }}
        >
          <div className="text-5xl font-black mb-1">{aqi}</div>
          <div className="text-sm font-medium" style={{ opacity: 0.85 }}>{category.label}</div>
          <div className="text-xs mt-0.5" style={{ opacity: 0.6 }}>AQI (US EPA)</div>
        </div>

        {/* Particles */}
        <div>
          <div className="text-[10px] font-bold text-green-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <span className="h-px flex-1 bg-green-500/20" />
            Частицы
            <span className="h-px flex-1 bg-green-500/20" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ParamCard label="PM1" value={pm1.toFixed(0)} unit="µg/m³" />
            <ParamCard label="PM2.5" value={pm25.toFixed(1)} unit="µg/m³" accent />
            <ParamCard label="PM10" value={pm10.toFixed(0)} unit="µg/m³" />
          </div>
        </div>

        {/* Gases */}
        <div>
          <div className="text-[10px] font-bold text-cyan-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <span className="h-px flex-1 bg-cyan-500/20" />
            Газы
            <span className="h-px flex-1 bg-cyan-500/20" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ParamCard label="CO₂" value={co2.toFixed(0)} unit="ppm" />
            <ParamCard label="CO" value={co.toFixed(2)} unit="ppm" />
            <ParamCard label="CH₂O" value={ch2o.toFixed(2)} unit="ppm" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <ParamCard label="VOC" value={voc.toFixed(2)} unit="ppm" />
            <ParamCard label="O₃" value={o3.toFixed(1)} unit="ppb" />
            <ParamCard label="NO₂" value={no2.toFixed(1)} unit="ppb" />
          </div>
        </div>

        {/* Environment */}
        {(temp != null || hum != null) && (
          <div>
            <div className="text-[10px] font-bold text-amber-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="h-px flex-1 bg-amber-500/20" />
              Среда
              <span className="h-px flex-1 bg-amber-500/20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {temp != null && (
                <div className="rounded-xl p-3 text-center bg-white/5 border border-white/10">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Температура</div>
                  <div className="text-2xl font-black text-white">{Number(temp).toFixed(1)}<span className="text-sm text-gray-400">°C</span></div>
                </div>
              )}
              {hum != null && (
                <div className="rounded-xl p-3 text-center bg-white/5 border border-white/10">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Влажность</div>
                  <div className="text-2xl font-black text-white">{Number(hum).toFixed(0)}<span className="text-sm text-gray-400">%</span></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-600 pt-2 border-t border-white/5">
          Обновляется каждые 5 секунд
        </div>
      </div>
    </div>
  );
}
