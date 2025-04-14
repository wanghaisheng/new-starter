'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react'
import { detectLocale } from './config'
import messages from './dictionaries'

interface I18nProviderProps {
  children: ReactNode
  locale?: string
}

export const I18nProvider = ({ children, locale = detectLocale() }: I18nProviderProps) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale as keyof typeof messages]}>
      {children}
    </NextIntlClientProvider>
  )
}

// Remove the re-exports that don't exist in config.ts
// export { useI18n, useCurrentLocale, useChangeLocale } from './config' 