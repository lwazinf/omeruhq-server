import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'af', 'zu'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});
