'use client';

import { useEffect, useState, useRef } from 'react';
import { authAPI, airQualityAPI, AirQualityData, sensorAPI } from '@/lib/api';
import MapVisualization from '@/components/MapVisualization';
import AirQualityCard from '@/components/AirQualityCard';
import CitySelector from '@/components/CitySelector';
import AuthModal from '@/components/AuthModal';
import Navigation from '@/components/Navigation';
import Cookies from 'js-cookie';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [allAirQuality, setAllAirQuality] = useState<AirQualityData[]>([]);
  const [purchasedSensors, setPurchasedSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedCity, setSelectedCity] = useState({ city: 'Almaty', state: 'Almaty', country: 'Kazakhstan' });
  const heroRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadAirQuality();
      loadAllAirQuality();
      loadPurchasedSensors();
    }
  }, [user, selectedCity]);

  // Перезагружаем датчики периодически
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadPurchasedSensors();
    }, 5000); // Обновляем каждые 5 секунд
    return () => clearInterval(interval);
  }, [user]);

  // Простой scroll reveal без эффекта погружения
  useEffect(() => {
    // Intersection Observer для scroll reveal
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('revealed');
            entry.target.classList.add('visible');
            entry.target.classList.add('in-view');
          }, index * 50);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal, .slide-up, .scale-in, .rotate-in, .smooth-section');
    revealElements.forEach(el => observer.observe(el));
    
    return () => {
      observer.disconnect();
    };
  }, [allAirQuality]);

  const checkAuth = async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (error) {
        Cookies.remove('token');
        setShowAuth(true);
      }
    } else {
      setShowAuth(true);
    }
    setLoading(false);
  };

  const loadAirQuality = async () => {
    try {
      setLoading(true);
      const data = await airQualityAPI.getAirQuality(
        selectedCity.city,
        selectedCity.state,
        selectedCity.country
      );
      setAirQuality(data);
    } catch (error: any) {
      console.error('Error loading air quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAirQuality = async () => {
    try {
      const data = await airQualityAPI.getAllAirQuality();
      console.log(`✅ Loaded ${data.length} air quality points from API`);
      if (data.length > 0) {
        console.log(`First point:`, data[0]);
        if (data.length > 1) {
          console.log(`Second point:`, data[1]);
        }
      }
      setAllAirQuality(data);
    } catch (error: any) {
      console.error('❌ Error loading all air quality:', error);
    }
  };

  const loadPurchasedSensors = async () => {
    if (!user) return;
    try {
      console.log('🔄 Loading purchased sensors for map...');
      const data = await sensorAPI.mapSensors();
      console.log(`✅ Loaded ${data?.length || 0} purchased sensors`);
      console.log('📊 Purchased sensors data:', data);
      if (data && Array.isArray(data) && data.length > 0) {
        // Фильтруем только те датчики, у которых есть координаты
        const validSensors = data.filter(s => s.lat && s.lng);
        console.log(`📍 Valid sensors with coordinates: ${validSensors.length}`);
        setPurchasedSensors(validSensors);
      } else {
        setPurchasedSensors([]);
      }
    } catch (error) {
      console.error('❌ Error loading purchased sensors:', error);
      setPurchasedSensors([]);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await authAPI.login(email, password);
      const userData = await authAPI.getMe();
      setUser(userData);
      setShowAuth(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      await authAPI.register(email, password, name);
      await handleLogin(email, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setShowAuth(true);
    setAirQuality(null);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f0f1a] via-[#1a1a2e] to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.1),transparent_70%)] animate-pulse"></div>
        <div className="relative text-center z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-500/20 border-t-green-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-cyan-400 animate-spin" style={{ animationDuration: '0.8s' }}></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-xl animate-pulse"></div>
          </div>
          <div className="text-green-400 font-bold text-xl mb-2 tracking-wide">Загрузка...</div>
          <div className="text-gray-400 text-sm">Подключение к датчикам</div>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      {showAuth && !user ? (
        <AuthModal
          onLogin={handleLogin}
          onRegister={handleRegister}
          onClose={() => {}}
        />
      ) : (
        <>
          <Navigation user={user} onLogout={handleLogout} />
          
          {/* Hero Section */}
          <div className="relative overflow-hidden section-transition" style={{ minHeight: '80vh' }}>
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,255,136,0.15),transparent_60%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(0,212,255,0.1),transparent_60%)]"></div>
            </div>
            <div 
              ref={heroRef}
              className="relative container mx-auto px-4 py-16 md:py-24 border-b border-green-500/20 scroll-reveal"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 border border-green-500/40 rounded-full text-sm font-medium text-green-300 mb-8 backdrop-blur-md shadow-lg shadow-green-500/10 float-animation">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="tracking-wide">Мониторинг в реальном времени</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-9xl font-black mb-6 md:mb-8 leading-tight">
                <span className="bg-gradient-to-r from-white via-green-100 via-emerald-200 to-cyan-200 bg-clip-text text-transparent block mb-2">
                  Качество воздуха
                </span>
                <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent block">
                  в Алматы
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-8 md:mb-12">
                Отслеживайте данные со всех датчиков в реальном времени с помощью интерактивной карты и получайте точную информацию о качестве воздуха
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform cursor-pointer text-center text-sm sm:text-base">
                  Начать мониторинг
                </div>
                <div className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-green-500/50 rounded-xl text-green-400 font-bold hover:bg-green-500/10 transition-all cursor-pointer text-center text-sm sm:text-base">
                  Узнать больше
                </div>
              </div>
            </div>
          </div>

          {/* Transition Section */}
          <div className="relative h-40 md:h-48 overflow-hidden smooth-section">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.15),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,255,136,0.05)_50%,transparent_100%)]"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 section-transition">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* Map Section */}
              <div className="lg:col-span-2">
                <div 
                  ref={mapRef}
                  className="glass-strong rounded-3xl border border-green-500/30 overflow-hidden shadow-2xl hover-lift relative group scroll-reveal"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 via-emerald-500/4 to-cyan-500/8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.1),transparent_50%)] pointer-events-none z-0"></div>
                  <div className="relative bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#1a1a1a] px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-green-500/30 z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 sm:gap-3 mb-2">
                          <div className="relative">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-ping opacity-75"></span>
                          </div>
                          <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">Карта качества воздуха</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                          <span className="font-bold text-green-400 text-base sm:text-lg">{allAirQuality.length}</span>
                          <span>активных датчиков</span>
                        </p>
                      </div>
                      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl backdrop-blur-sm shadow-lg shadow-green-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-300 text-xs font-bold tracking-wider">LIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-0 h-[400px] sm:h-[500px] md:h-[600px] lg:h-[650px] relative z-20" style={{ pointerEvents: 'auto' }}>
                    <MapVisualization
                      airQualityData={airQuality}
                      allAirQualityData={allAirQuality}
                      purchasedSensors={purchasedSensors}
                      onLocationSelect={(lat, lon) => {
                        loadAirQuality();
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {allAirQuality.length > 0 && (
                  <div
                    ref={cardRef}
                    className="scroll-reveal"
                  >
                    <AirQualityCard data={allAirQuality[0]} />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stats Section */}
            {allAirQuality.length > 0 && (
              <div className="mt-8 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="glass rounded-2xl p-8 border border-green-500/20 hover-lift scale-in group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-5xl font-black text-green-400 mb-3">{allAirQuality.length}</div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wide">Активных датчиков</div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-8 border border-emerald-500/20 hover-lift scale-in group relative overflow-hidden" style={{ transitionDelay: '0.1s' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-5xl font-black text-emerald-400 mb-3">
                      {Math.round(allAirQuality.reduce((sum, d) => sum + (d.current?.pollution?.aqius || 0), 0) / allAirQuality.length)}
                    </div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wide">Средний AQI</div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-8 border border-cyan-500/20 hover-lift scale-in group relative overflow-hidden" style={{ transitionDelay: '0.2s' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-5xl font-black text-cyan-400 mb-3">24/7</div>
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wide">Мониторинг</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
