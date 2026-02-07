# Internationalization (i18n) with next-intl – Notes

## How to Add a New Language

1. **Add the locale to routing**  
   Edit `i18n/routing.ts`:
   ```ts
   export const routing = defineRouting({
     locales: ['en', 'ru', 'kk', 'fr'], // Add 'fr' for French
     defaultLocale: 'ru',
     localePrefix: 'always',
   });
   ```

2. **Create translation files**  
   Add `messages/fr/` with the same structure as existing locales:
   ```
   messages/fr/
     common.json
     map.json
     nav.json
     auth.json
     home.json
     about.json
     dashboard.json
   ```

3. **No further code changes**  
   The middleware and LanguageSwitcher use `routing.locales`, so the new language appears automatically.

## How to Add New Translation Keys

### For map/dashboard features

1. **Add the key to all locale files**  
   For example, to add a new map filter label:
   - `messages/en/map.json`: `"newFilter": "New Filter"`
   - `messages/ru/map.json`: `"newFilter": "Новый фильтр"`
   - `messages/kk/map.json`: `"newFilter": "Жаңа сүзгі"`

2. **Use in components**
   ```tsx
   const t = useTranslations('map');
   return <span>{t('newFilter')}</span>;
   ```

### Namespaces

- `common` – Shared labels (brand, loading, sensor, etc.)
- `map` – Map card, filters, AQI labels, popup text
- `nav` – Menu items, language switcher, auth links
- `auth` – Login/register modal
- `home` – Hero section, dashboard stats
- `about` – About page content
- `dashboard` – Air quality index and dashboard-specific labels

## File Structure

```
frontend/
├── i18n/
│   ├── routing.ts      # Locales, default, prefix
│   ├── request.ts      # Loads messages per locale
│   └── navigation.ts   # Link, useRouter, usePathname wrappers
├── messages/
│   ├── en/
│   │   ├── common.json
│   │   ├── map.json
│   │   └── ...
│   ├── ru/
│   └── kk/
├── middleware.ts       # next-intl createMiddleware
├── components/
│   └── nav/
│       └── LanguageSwitcher.tsx
└── app/
    └── [locale]/       # All pages under locale segment
```

## URL Structure

- `/en/dashboard` – English
- `/ru/dashboard` – Russian  
- `/kk/dashboard` – Kazakh

The language switcher keeps the current path when changing locale (e.g. `/en/dashboard` → `/ru/dashboard`).
