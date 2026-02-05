'use client';

import { useEffect, useState } from 'react';
import { adminAPI, authAPI, sensorAPI, Sensor, AdminUser, User, adminAuthAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminNavItem {
  name: string;
  icon: string;
  path: string;
}

const adminNavItems: AdminNavItem[] = [
  { name: 'Дашборд', icon: '📊', path: '/admin' },
  { name: 'Датчики', icon: '📡', path: '/admin/sensors' },
  { name: 'Пользователи', icon: '👥', path: '/admin/users' },
  { name: 'Права доступа', icon: '🔐', path: '/admin/permissions' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    totalSensors: 0,
    totalUsers: 0,
    totalPurchases: 0,
    activeSensors: 0,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authAPI.getMe();
        setUser(me);
        if (me.role === 'admin') {
          setIsAuthenticated(true);
          loadStats();
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        Cookies.remove('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadStats = async () => {
    try {
      const [sensors, users] = await Promise.all([
        adminAPI.listSensors(),
        adminAPI.listUsers(),
      ]);
      setStats({
        totalSensors: sensors.length,
        totalUsers: users.length,
        totalPurchases: users.reduce((sum, u) => sum + (u.sensor_permissions?.length || 0), 0),
        activeSensors: sensors.filter(s => s.price > 0).length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminSecret.trim()) {
      toast.error('Введите админ секрет');
      return;
    }
    try {
      await adminAuthAPI.login(adminSecret);
      const me = await authAPI.getMe();
      setUser(me);
      if (me.role === 'admin') {
        setIsAuthenticated(true);
        toast.success('Вход выполнен успешно');
        loadStats();
      } else {
        toast.error('Неверный секрет');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка входа');
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-green-400 text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f0f1a] to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]"></div>
        
        <div className="glass-strong rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Админ Панель</h1>
            <p className="text-gray-400">Введите админ секрет для доступа</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Админ Секрет
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full px-4 py-3 border-2 border-gray-700/50 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-[#0f0f0f] text-white placeholder-gray-500"
                placeholder="admin-secret"
              />
            </div>

            <button
              onClick={handleAdminLogin}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold text-lg hover:from-red-400 hover:to-orange-400 transform hover:scale-[1.02] transition-all duration-300 shadow-2xl shadow-red-500/30"
            >
              Войти как админ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05),transparent_70%)]"></div>
      </div>

      {/* Admin Navbar */}
      <nav className="glass-strong border-b border-red-500/20 sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-xl font-black text-white">⚙️</span>
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Админ Панель</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-1">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="px-4 py-2 text-gray-300 hover:text-white font-semibold rounded-lg hover:bg-red-500/10 transition-all duration-200 text-sm flex items-center space-x-2"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg">
                <span className="text-red-400 text-sm font-medium">{user?.name || 'Admin'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 hover:text-red-300 font-medium transition-all duration-200 border border-red-500/30 hover:border-red-500/50 rounded-lg text-sm"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-red-100 to-orange-200 bg-clip-text text-transparent">
              Дашборд
            </h1>
            <p className="text-gray-300 text-lg">
              Обзор системы и статистика
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-strong rounded-2xl border border-red-500/30 p-6 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📡</span>
                </div>
                <span className="text-3xl font-black text-red-400">{stats.totalSensors}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Всего датчиков</h3>
              <p className="text-gray-400 text-sm">Созданных в системе</p>
            </div>

            <div className="glass-strong rounded-2xl border border-red-500/30 p-6 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-3xl font-black text-red-400">{stats.totalUsers}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Пользователей</h3>
              <p className="text-gray-400 text-sm">Зарегистрировано</p>
            </div>

            <div className="glass-strong rounded-2xl border border-red-500/30 p-6 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-3xl font-black text-red-400">{stats.totalPurchases}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Покупок</h3>
              <p className="text-gray-400 text-sm">Всего совершено</p>
            </div>

            <div className="glass-strong rounded-2xl border border-red-500/30 p-6 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <span className="text-3xl font-black text-red-400">{stats.activeSensors}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Активных</h3>
              <p className="text-gray-400 text-sm">Платных датчиков</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-strong rounded-2xl border border-red-500/30 p-6">
            <h2 className="text-2xl font-black text-white mb-4">Быстрые действия</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/sensors"
                className="px-6 py-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30 rounded-xl transition-all hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">➕</span>
                  <div>
                    <div className="text-white font-bold">Создать датчик</div>
                    <div className="text-gray-400 text-sm">Добавить новый платный датчик</div>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/users"
                className="px-6 py-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30 rounded-xl transition-all hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <div className="text-white font-bold">Управление пользователями</div>
                    <div className="text-gray-400 text-sm">Просмотр и редактирование</div>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/permissions"
                className="px-6 py-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30 rounded-xl transition-all hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <div className="text-white font-bold">Права доступа</div>
                    <div className="text-gray-400 text-sm">Выдача прав на датчики</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
