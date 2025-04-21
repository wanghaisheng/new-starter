'use client';

import { PropsWithChildren } from 'react';

import { DatabaseProvider } from './database';
import { IonicProvider } from './ionic';
import { I18nProvider } from '@/core/lib/i18n/I18nProvider';
import { initAppService } from '@/core/services/business/app-service-init';
import { MessageProvider } from './MessageProvider';
import { MatchProvider } from './MatchProvider';
import { NotificationProvider } from './NotificationProvider';
import { ThemeProvider } from './ThemeProvider';
import { PermissionProvider } from './PermissionProvider';

initAppService();

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      <I18nProvider>
        <ThemeProvider>
          <PermissionProvider>
            <DatabaseProvider>
              <MessageProvider>
                <MatchProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </MatchProvider>
              </MessageProvider>
            </DatabaseProvider>
          </PermissionProvider>
        </ThemeProvider>
      </I18nProvider>
    </IonicProvider>
  );
}
