'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { routing } from '@/i18n/routing';
import clsx from 'clsx';

export function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = useCallback(
    (newLocale: 'en' | 'ru' | 'kk') => {
      if (newLocale === locale) return;
      router.replace(pathname, { locale: newLocale });
    },
    [locale, pathname, router]
  );

  return (
    <div
      className="flex items-center rounded-lg border border-white/10 overflow-hidden"
      role="group"
      aria-label={t('changeLanguage')}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleLocaleChange(loc as 'en' | 'ru' | 'kk')}
          aria-pressed={locale === loc}
          aria-label={`${t('changeLanguage')}: ${t(`language.${loc}`)}`}
          className={clsx(
            'px-3 py-1.5 text-xs font-bold transition-all min-w-[40px]',
            'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-black',
            locale === loc
              ? 'bg-green-500/30 text-green-200 border-green-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
          )}
        >
          {t(`language.${loc}`)}
        </button>
      ))}
    </div>
  );
}
