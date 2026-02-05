'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface AuthModalProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onClose: () => void;
}

export default function AuthModal({ onLogin, onRegister }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
        toast.success('Logged in successfully!');
      } else {
        await onRegister(email, password, name);
        toast.success('Registered successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f0f1a] via-[#1a1a2e] to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,255,136,0.15),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(0,212,255,0.1),transparent_60%)]"></div>
      
      <div className="glass-strong rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all relative z-10 fade-in">
        {/* Header with IQAir style */}
        <div className="relative bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-cyan-500/20 p-10 text-center border-b border-green-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.2),transparent_70%)]"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-2xl shadow-green-500/50">
                  <span className="text-3xl font-black text-white drop-shadow-lg">+</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500 rounded-xl blur-xl opacity-60"></div>
              </div>
              <span className="text-4xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">IQAir</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">
              {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h2>
            <p className="text-gray-300 text-sm">
              {isLogin ? 'Войдите, чтобы продолжить' : 'Присоединяйтесь к мониторингу качества воздуха'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Полное имя
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-700/50 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-[#0f0f0f] text-white placeholder-gray-500 hover:border-gray-600"
                    placeholder="Иван Иванов"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Email адрес
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-700/50 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-[#0f0f0f] text-white placeholder-gray-500 hover:border-gray-600"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-700/50 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-[#0f0f0f] text-white placeholder-gray-500 hover:border-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-400 hover:via-emerald-400 hover:to-cyan-400 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl shadow-green-500/30 hover:shadow-green-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </span>
              ) : (
                isLogin ? 'Войти' : 'Создать аккаунт'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-sm text-gray-400 hover:text-green-400 font-medium transition-colors"
            >
              {isLogin ? (
                <>
                  Нет аккаунта?{' '}
                  <span className="text-green-400 font-bold">Зарегистрироваться</span>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <span className="text-green-400 font-bold">Войти</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

