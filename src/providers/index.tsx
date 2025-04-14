'use client';

import { PropsWithChildren } from 'react';

import { DatabaseProvider } from './database';
import { IonicProvider } from './ionic';
import { I18nProvider } from '@/core/lib/i18n/I18nProvider';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      <I18nProvider>
        <DatabaseProvider>
          {children}
        </DatabaseProvider>
      </I18nProvider>
    </IonicProvider>
  );
}
