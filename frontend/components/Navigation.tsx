'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavigationProps {
  user: any;
  onLogout?: () => void;
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const menuItems = [
    {
      name: '3D Карта',
      description: 'Интерактивная 3D карта загрязнения воздуха',
      items: ['3D Глобус', 'Мировая карта', 'Реальное время', 'Исторические данные']
    },
    {
      name: 'Качество воздуха',
      description: 'Мониторинг качества воздуха в реальном времени',
      items: ['Карта качества воздуха', 'Рейтинг городов', 'Исторические данные', 'Прогноз качества воздуха']
    },
    {
      name: 'Мониторы',
      description: 'Умные мониторы качества воздуха',
      items: ['AirVisual Pro', 'AirVisual Outdoor', 'AirVisual Node', 'Сравнение моделей']
    },
    {
      name: 'Очистители',
      description: 'Очистители воздуха для дома и офиса',
      items: ['AirVisual Pro', 'AirVisual Outdoor', 'Для дома', 'Для офиса']
    },
    {
      name: 'Решения',
      description: 'Корпоративные решения',
      items: ['Для бизнеса', 'Для школ', 'Для больниц', 'API интеграция']
    },
    {
      name: 'Новости',
      description: 'Последние новости о качестве воздуха',
      items: ['Новости', 'Исследования', 'Блог', 'Пресс-релизы']
    },
    {
      name: 'О нас',
      description: 'Узнайте больше о Breez',
      items: ['О компании', 'Команда', 'Карьера', 'Контакты']
    }
  ];

  return (
    <nav className="glass-strong border-b border-green-500/20 sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 md:space-x-3 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="relative">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-2xl shadow-green-500/50 group-hover:shadow-green-500/80 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <span className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">+</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500 rounded-xl blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
              </div>
              <span className="text-2xl md:text-4xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">Breez</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2">
            {menuItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.name === '3D Карта' ? '/3d-map' :
                        item.name === 'Качество воздуха' ? '/air-quality' : 
                        item.name === 'Мониторы' ? '/monitors' :
                        item.name === 'Очистители' ? '/purifiers' :
                        item.name === 'Решения' ? '/solutions' :
                        item.name === 'Новости' ? '/news' :
                        item.name === 'О нас' ? '/about' : '#'}
                  className="px-5 py-3 text-gray-300 hover:text-white font-semibold rounded-lg hover:bg-white/5 transition-all duration-200 relative group text-base"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 group-hover:w-full transition-all duration-300"></span>
                </Link>
                
                {/* Dropdown Menu */}
                {hoveredItem === item.name && (
                  <div className="absolute top-full left-0 mt-2 w-72 glass-strong rounded-xl border border-green-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-green-500/20">
                      <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                    <div className="p-2">
                      {item.items.map((subItem) => (
                        <a
                          key={subItem}
                          href="#"
                          className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-green-500/10 rounded-lg transition-all duration-200 text-sm"
                        >
                          {subItem}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="hidden lg:inline-flex px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-200 font-semibold hover:bg-green-500/25 transition"
              >
                Админка
              </Link>
            )}
            <button className="text-gray-400 hover:text-green-400 transition-colors hidden md:block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {user ? (
              <div className="flex items-center space-x-2 md:space-x-3">
                <Link
                  href="/sensors"
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 font-medium transition-all duration-200 text-sm md:text-base"
                >
                  <span className="hidden sm:inline">🛒 Датчики</span>
                  <span className="sm:hidden">🛒</span>
                </Link>
                <div className="px-2 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                  <span className="text-green-400 text-xs md:text-sm font-medium hidden sm:inline">Привет, {user.name}</span>
                  <span className="text-green-400 text-xs font-medium sm:hidden">{user.name.split(' ')[0]}</span>
                </div>
                <button
                  onClick={() => onLogout?.()}
                  className="px-3 md:px-5 py-1.5 md:py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 hover:text-red-300 font-medium transition-all duration-200 border border-red-500/30 hover:border-red-500/50 rounded-lg hover:shadow-lg hover:shadow-red-500/20 text-sm md:text-base"
                >
                  <span className="hidden sm:inline">Выйти</span>
                  <span className="sm:hidden">✕</span>
                </button>
              </div>
            ) : (
              <button className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold transition-all duration-200 rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 text-sm md:text-base">
                Войти
              </button>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-400 hover:text-white p-2"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu Panel */}
            <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] border-l border-green-500/30 shadow-2xl">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-green-500/20 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-xl font-black text-white">+</span>
                    </div>
                    <span className="text-xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Breez</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  <div className="py-4 px-4 space-y-2">
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-200 font-semibold text-lg hover:bg-green-500/25 transition"
                      >
                        Админка
                      </Link>
                    )}
                    {menuItems && menuItems.length > 0 ? (
                      menuItems.map((item) => {
                        const isExpanded = expandedItems[item.name] || false;
                        const itemUrl = item.name === '3D Карта' ? '/3d-map' :
                                       item.name === 'Качество воздуха' ? '/air-quality' : 
                                       item.name === 'Мониторы' ? '/monitors' :
                                       item.name === 'Очистители' ? '/purifiers' :
                                       item.name === 'Решения' ? '/solutions' :
                                       item.name === 'Новости' ? '/news' :
                                       item.name === 'О нас' ? '/about' : '#';
                        
                        return (
                          <div key={item.name} className="border-b border-green-500/10 last:border-0 pb-2">
                            <div className="flex items-center">
                              <Link
                                href={itemUrl}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 px-4 py-4 text-white hover:text-green-400 font-bold text-lg rounded-lg hover:bg-green-500/10 transition-all duration-200 active:bg-green-500/20 min-h-[56px] flex items-center"
                                style={{ color: '#ffffff' }}
                              >
                                {item.name}
                              </Link>
                              <button
                                onClick={() => setExpandedItems(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                                className="p-3 ml-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all rounded-lg active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center"
                              >
                                <svg 
                                  className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="pl-4 pr-2 pb-2 pt-2 space-y-2">
                                {item.items && item.items.map((subItem) => (
                                  <Link
                                    key={subItem}
                                    href={itemUrl}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex px-4 py-3 text-gray-300 hover:text-green-400 hover:bg-green-500/5 rounded-lg transition-all duration-200 text-base active:bg-green-500/10 min-h-[48px] items-center"
                                    style={{ color: '#d1d5db' }}
                                  >
                                    {subItem}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-white px-4 py-4">Нет элементов меню</div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-green-500/20 flex-shrink-0">
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-center">
                        <span className="text-green-400 text-sm font-medium">{user.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          onLogout?.();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 hover:text-red-300 font-semibold text-sm transition-all duration-200 border border-red-500/30 hover:border-red-500/50 rounded-lg active:scale-95 min-h-[48px]"
                      >
                        Выйти
                      </button>
                    </div>
                  ) : (
                    <a
                      href="#"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold text-sm transition-all duration-200 rounded-lg shadow-lg shadow-green-500/30 text-center active:scale-95 min-h-[48px] items-center justify-center"
                    >
                      Войти
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
