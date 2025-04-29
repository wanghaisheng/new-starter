'use client';

import { PropsWithChildren } from 'react';

import { IonicProvider } from './ionic';
import { I18nProvider } from '@/core/lib/i18n/I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { PermissionProvider } from './PermissionProvider';
import { ServiceProvider } from './ServiceProvider';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      <I18nProvider>
        <ThemeProvider>
          <PermissionProvider>
            <ServiceProvider>
              {children}
            </ServiceProvider>
          </PermissionProvider>
        </ThemeProvider>
      </I18nProvider>
    </IonicProvider>
  );
}
