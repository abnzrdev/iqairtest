'use client';

import { useEffect, useState } from 'react';
import { sensorAPI, authAPI, Sensor, User } from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function SensorsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allSensors, setAllSensors] = useState<(Sensor & { is_purchased: boolean })[]>([]);
  const [mySensors, setMySensors] = useState<Sensor[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authAPI.getMe();
        setUser(me);
        await Promise.all([loadAllSensors(), loadMySensors()]);
      } catch (err) {
        Cookies.remove('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadAllSensors = async () => {
    try {
      const data = await sensorAPI.allSensors();
      console.log('📊 Loaded all sensors:', data.length);
      console.log('📊 Sensors data:', data);
      setAllSensors(data);
    } catch (err: any) {
      console.error('❌ Error loading all sensors:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      // Устанавливаем пустой массив при ошибке, чтобы не ломать UI
      setAllSensors([]);
    }
  };

  const loadMySensors = async () => {
    try {
      const data = await sensorAPI.mySensors();
      setMySensors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async (sensorId: string) => {
    setPurchasing(sensorId);
    try {
      await sensorAPI.purchase(sensorId);
      toast.success('Датчик успешно куплен! Теперь он доступен на карте с дополнительными параметрами.');
      // Небольшая задержка, чтобы база данных успела обновиться
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Перезагружаем данные несколько раз для надежности
      console.log('🔄 Reloading sensors after purchase...');
      await Promise.all([loadAllSensors(), loadMySensors()]);
      await new Promise(resolve => setTimeout(resolve, 500));
      await Promise.all([loadAllSensors(), loadMySensors()]);
      console.log('✅ Sensors reloaded');
    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      toast.error(err.response?.data?.detail || 'Ошибка покупки');
    } finally {
      setPurchasing(null);
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
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Необходима авторизация</div>
          <Link href="/" className="text-green-400 hover:text-green-300">
            Войти в систему
          </Link>
        </div>
      </div>
    );
  }

  const purchasedSensors = allSensors.filter(s => s.is_purchased);
  const availableSensors = allSensors.filter(s => !s.is_purchased);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]"></div>
      </div>

      <Navigation user={user} onLogout={() => { Cookies.remove('token'); setUser(null); }} />

      <div className="relative z-10 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-green-100 to-cyan-200 bg-clip-text text-transparent">
              Магазин датчиков
            </h1>
            <p className="text-gray-300 text-lg">
              Покупайте доступ к платным датчикам для просмотра данных на карте с дополнительными параметрами
            </p>
          </div>

          {purchasedSensors.length > 0 && (
            <div className="glass-strong rounded-2xl border border-green-500/30 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Купленные датчики ({purchasedSensors.length})
                </h2>
                <Link
                  href="/3d-map"
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                >
                  Посмотреть на карте →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchasedSensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="p-4 bg-[#0f0f0f] rounded-xl border-2 border-green-500/50 relative"
                  >
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-green-500/30 text-green-400 text-xs font-bold rounded-lg border border-green-500/50">
                        ✓ КУПЛЕНО
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 pr-20">{sensor.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{sensor.description || 'Нет описания'}</p>
                    <div className="space-y-1 text-sm text-gray-500 mb-3">
                      <div><span className="text-gray-400">Город:</span> {sensor.city || 'N/A'}</div>
                      <div><span className="text-gray-400">Страна:</span> {sensor.country || 'N/A'}</div>
                      <div><span className="text-gray-400">PM2.5:</span> {sensor.parameters?.pm25 || 0} µg/m³</div>
                      <div><span className="text-gray-400">PM10:</span> {sensor.parameters?.pm10 || 0} µg/m³</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                      <p className="text-green-400 text-xs font-semibold mb-1">Доступны дополнительные параметры:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs rounded">CO2</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs rounded">VOC</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs rounded">CO</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs rounded">O3</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs rounded">NO2</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-strong rounded-2xl border border-green-500/30 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Доступные для покупки ({availableSensors.length})
            </h2>
            {availableSensors.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">Нет доступных датчиков</p>
                <p className="text-sm mt-2">Все датчики уже куплены или еще не созданы</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="p-4 bg-[#0f0f0f] rounded-xl border border-gray-700/50 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-bold text-lg">{sensor.name}</h3>
                      <span className="text-green-400 font-bold text-xl">{sensor.price}₸</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{sensor.description || 'Нет описания'}</p>
                    <div className="space-y-1 text-sm text-gray-500 mb-4">
                      <div><span className="text-gray-400">Город:</span> {sensor.city || 'N/A'}</div>
                      <div><span className="text-gray-400">Страна:</span> {sensor.country || 'N/A'}</div>
                      <div><span className="text-gray-400">PM2.5:</span> {sensor.parameters?.pm25 || 0} µg/m³</div>
                      <div><span className="text-gray-400">PM10:</span> {sensor.parameters?.pm10 || 0} µg/m³</div>
                    </div>
                    <button
                      onClick={() => handlePurchase(sensor.id)}
                      disabled={purchasing === sensor.id}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {purchasing === sensor.id ? 'Покупка...' : 'Купить датчик'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
