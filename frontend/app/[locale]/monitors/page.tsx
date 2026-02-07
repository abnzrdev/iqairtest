'use client';

import Navigation from '@/components/Navigation';

export default function MonitorsPage() {
  const monitors = [
    {
      name: 'AirVisual Pro',
      price: '299$',
      image: '📱',
      features: ['PM2.5, PM10, CO2', 'Wi-Fi подключение', 'Приложение для iOS/Android', 'Исторические данные'],
      description: 'Профессиональный монитор качества воздуха для дома и офиса'
    },
    {
      name: 'AirVisual Outdoor',
      price: '199$',
      image: '🏠',
      features: ['Уличный монитор', 'Защита от влаги IP65', 'Солнечная батарея', 'Долговечный корпус'],
      description: 'Монитор для наружного использования с защитой от непогоды'
    },
    {
      name: 'AirVisual Node',
      price: '149$',
      image: '📊',
      features: ['Компактный дизайн', 'Батарея до 6 месяцев', 'Bluetooth', 'Экран E-ink'],
      description: 'Портативный монитор с длительным временем работы'
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navigation user={null} onLogout={() => {}} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-white via-green-100 to-cyan-200 bg-clip-text text-transparent">
              Мониторы качества воздуха
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Умные мониторы для отслеживания качества воздуха в реальном времени
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          {monitors.map((monitor) => (
            <div key={monitor.name} className="glass-strong rounded-3xl border border-green-500/30 overflow-hidden hover-lift group">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-8 text-center">
                <div className="text-8xl mb-4">{monitor.image}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{monitor.name}</h3>
                <div className="text-3xl font-black text-green-400 mb-4">{monitor.price}</div>
                <p className="text-gray-300 mb-6">{monitor.description}</p>
              </div>
              <div className="p-6">
                <h4 className="text-white font-semibold mb-4">Основные функции:</h4>
                <ul className="space-y-2">
                  {monitor.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform">
                  Узнать больше
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="glass-strong rounded-2xl sm:rounded-3xl border border-green-500/30 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Сравнение моделей</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-green-500/20">
                    <th className="text-left py-3 sm:py-4 text-white font-semibold text-sm sm:text-base">Характеристика</th>
                    <th className="text-center py-3 sm:py-4 text-white font-semibold text-sm sm:text-base">AirVisual Pro</th>
                    <th className="text-center py-3 sm:py-4 text-white font-semibold text-sm sm:text-base">AirVisual Outdoor</th>
                    <th className="text-center py-3 sm:py-4 text-white font-semibold text-sm sm:text-base">AirVisual Node</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-green-500/10">
                    <td className="py-3 sm:py-4 text-gray-300 text-sm sm:text-base">PM2.5</td>
                    <td className="text-center text-green-400 text-lg">✓</td>
                    <td className="text-center text-green-400 text-lg">✓</td>
                    <td className="text-center text-green-400 text-lg">✓</td>
                  </tr>
                  <tr className="border-b border-green-500/10">
                    <td className="py-3 sm:py-4 text-gray-300 text-sm sm:text-base">Wi-Fi</td>
                    <td className="text-center text-green-400 text-lg">✓</td>
                    <td className="text-center text-green-400 text-lg">✓</td>
                    <td className="text-center text-gray-500 text-lg">—</td>
                  </tr>
                  <tr className="border-b border-green-500/10">
                    <td className="py-3 sm:py-4 text-gray-300 text-sm sm:text-base">Защита от влаги</td>
                    <td className="text-center text-gray-500 text-lg">—</td>
                    <td className="text-center text-green-400 text-sm sm:text-base">IP65</td>
                    <td className="text-center text-gray-500 text-lg">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 sm:py-4 text-gray-300 text-sm sm:text-base">Батарея</td>
                    <td className="text-center text-gray-300 text-sm sm:text-base">Проводной</td>
                    <td className="text-center text-gray-300 text-sm sm:text-base">Солнечная</td>
                    <td className="text-center text-gray-300 text-sm sm:text-base">6 месяцев</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

