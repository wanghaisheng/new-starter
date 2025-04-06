import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from './dictionaries';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./dictionaries/${locale}.json`)).default
  };
});

// 导出支持的语言列表
export const supportedLocales = locales;

// 导出默认语言
export const defaultLocale = 'en' as const;

// 导出语言切换函数
export const changeLocale = (locale: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
    window.location.reload();
  }
};

// 导出语言检测函数
export const detectLocale = (): string => {
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && supportedLocales.includes(savedLocale)) {
      return savedLocale;
    }
    
    const browserLocale = navigator.language.split('-')[0];
    if (supportedLocales.includes(browserLocale)) {
      return browserLocale;
    }
  }
  return defaultLocale;
}; 