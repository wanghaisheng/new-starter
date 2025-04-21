import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { NotificationServiceRegistry } from '@/core/services/business/notifications/registry/notification-service-registry';
import type { INotificationService } from '@/core/services/business/notifications/types/notification-service';

export const NotificationContext = createContext<INotificationService | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  // 推荐 hooks 场景直接用 getDefaultService，后续如需多环境可参数化
  const notificationService = useMemo(() => {
    return NotificationServiceRegistry.getInstance().getDefaultService();
  }, []);
  return (
    <NotificationContext.Provider value={notificationService}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotificationService(): INotificationService {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('NotificationService 未注入，请确保组件被 NotificationProvider 包裹');
  return ctx;
}
