'use client';

import Navigation from '@/components/Navigation';

export default function PurifiersPage() {
  const purifiers = [
    {
      name: 'AirVisual Pro',
      category: 'Для дома',
      price: '599$',
      image: '🏡',
      specs: {
        coverage: '50 м²',
        cadr: '350 м³/ч',
        filters: 'HEPA + Угольный',
        noise: '25 дБ'
      },
      description: 'Мощный очиститель для больших помещений'
    },
    {
      name: 'AirVisual Compact',
      category: 'Для офиса',
      price: '399$',
      image: '🏢',
      specs: {
        coverage: '30 м²',
        cadr: '250 м³/ч',
        filters: 'HEPA',
        noise: '20 дБ'
      },
      description: 'Компактный очиститель для офисных помещений'
    },
    {
      name: 'AirVisual Mini',
      category: 'Для дома',
      price: '249$',
      image: '🏠',
      specs: {
        coverage: '20 м²',
        cadr: '150 м³/ч',
        filters: 'HEPA',
        noise: '18 дБ'
      },
      description: 'Экономичный вариант для небольших комнат'
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navigation user={null} onLogout={() => {}} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-white via-green-100 to-cyan-200 bg-clip-text text-transparent">
              Очистители воздуха
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Дышите чистым воздухом с нашими профессиональными очистителями
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6 md:mb-8">
          {['Все', 'Для дома', 'Для офиса'].map((cat) => (
            <button
              key={cat}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-white font-semibold hover:scale-105 transition-transform text-sm sm:text-base"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {purifiers.map((purifier) => (
            <div key={purifier.name} className="glass-strong rounded-3xl border border-green-500/30 overflow-hidden hover-lift">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-8 text-center">
                <div className="text-8xl mb-4">{purifier.image}</div>
                <div className="px-3 py-1 bg-green-500/30 rounded-full text-green-300 text-sm font-semibold inline-block mb-3">
                  {purifier.category}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{purifier.name}</h3>
                <div className="text-3xl font-black text-green-400 mb-4">{purifier.price}</div>
                <p className="text-gray-300">{purifier.description}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Покрытие</div>
                    <div className="text-white font-bold">{purifier.specs.coverage}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">CADR</div>
                    <div className="text-white font-bold">{purifier.specs.cadr}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Фильтры</div>
                    <div className="text-white font-bold text-sm">{purifier.specs.filters}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Шум</div>
                    <div className="text-white font-bold">{purifier.specs.noise}</div>
                  </div>
                </div>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform">
                  Купить сейчас
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 glass-strong rounded-3xl border border-green-500/30 p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Почему выбирают IQAir?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔬', title: 'Научный подход', desc: 'Разработано с использованием последних исследований' },
              { icon: '⚡', title: 'Энергоэффективность', desc: 'Низкое потребление энергии при высокой производительности' },
              { icon: '🛡️', title: 'Гарантия качества', desc: '5 лет гарантии и пожизненная поддержка' },
            ].map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

