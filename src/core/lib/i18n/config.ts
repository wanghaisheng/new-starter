import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define supported locales as a const array for type safety
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export default getRequestConfig(async ({locale}: { locale: string }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as Locale,
    messages: (await import(`./dictionaries/${locale}.json`)).default
  };
});

// Export supported locales
export const supportedLocales = locales;

// Export default locale with type safety
export const defaultLocale: Locale = 'en';

// Export locale change function with type safety
export const changeLocale = (locale: Locale) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
    window.location.reload();
  }
};

// Export locale detection function with type safety
export const detectLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && supportedLocales.includes(savedLocale)) {
      return savedLocale;
    }
    
    const browserLocale = navigator.language.split('-')[0] as Locale;
    if (supportedLocales.includes(browserLocale)) {
      return browserLocale;
    }
  }
  return defaultLocale;
}; 