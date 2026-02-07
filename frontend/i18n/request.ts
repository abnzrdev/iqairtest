import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const isLocale = (
    value?: string | null
  ): value is (typeof routing.locales)[number] =>
    !!value && routing.locales.includes(value as (typeof routing.locales)[number]);
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  const [common, map, nav, auth, home, about, dashboard] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/map.json`),
    import(`../messages/${locale}/nav.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/home.json`),
    import(`../messages/${locale}/about.json`),
    import(`../messages/${locale}/dashboard.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      map: map.default,
      nav: nav.default,
      auth: auth.default,
      home: home.default,
      about: about.default,
      dashboard: dashboard.default,
    },
  };
});
