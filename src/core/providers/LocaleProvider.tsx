import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'zh' | 'en';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  systemLocale: Locale;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // 检测系统语言，初始优先用户设置，无则自动检测
  const detectSystemLocale = (): Locale => {
    if (typeof navigator !== 'undefined') {
      const lang = navigator.language || navigator.languages?.[0] || 'zh';
      return lang.startsWith('en') ? 'en' : 'zh';
    }
    return 'zh';
  };
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale | null;
      return stored || detectSystemLocale();
    }
    return 'zh';
  });
  const [systemLocale, setSystemLocale] = useState<Locale>(detectSystemLocale());

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  useEffect(() => {
    // 响应系统语言变化
    const handleLang = () => {
      setSystemLocale(detectSystemLocale());
    };
    window.addEventListener('languagechange', handleLang);
    return () => window.removeEventListener('languagechange', handleLang);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, systemLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
