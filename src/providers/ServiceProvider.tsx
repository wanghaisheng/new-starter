import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDatabase } from './database/DatabaseProvider';
import { UserService } from '@/core/services/business/user/service/user-service';
import { MessageServiceRegistry } from '@/core/services/business/message/registry/message-service-registry';
import { NotificationServiceRegistry } from '@/core/services/business/notification/registry/notification-service-registry';

// 业务服务 context 类型
interface ServiceContextType {
  userService: UserService;
  messageService: any;
  notificationService: any;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const userService = useMemo(() => new UserService(db), [db]);
  const messageService = useMemo(() => MessageServiceRegistry.getInstance().createService('remote', db), [db]);
  const notificationService = useMemo(() => NotificationServiceRegistry.getInstance().createService('remote', db), [db]);

  return (
    <ServiceContext.Provider value={{ userService, messageService, notificationService }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error('useService 必须在 ServiceProvider 内使用');
  return ctx;
}
