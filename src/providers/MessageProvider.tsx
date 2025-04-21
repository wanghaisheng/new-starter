import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { MessageServiceRegistry } from '@/core/services/business/messages/registry/message-service-registry';
import type { IMessageService } from '@/core/services/business/messages/types/message-service';

export const MessageContext = createContext<IMessageService | null>(null);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const messageService = useMemo(() => MessageServiceRegistry.get('message'), []);
  return (
    <MessageContext.Provider value={messageService}>
      {children}
    </MessageContext.Provider>
  );
};

export function useMessageService(): IMessageService {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('MessageService 未注入，请确保组件被 MessageProvider 包裹');
  return ctx;
}
