import { useEffect, useState } from 'react';
import { UserService } from '@/core/services/user-service';
import { MessageService } from '@/core/services/message-service';
import { AuthServiceFactory, IAuthService } from '@/core/services/auth-service';
import { initializeAuthService } from '@/core/config/auth-config';

/**
 * 自定义Hook，用于获取用户服务、消息服务和认证服务的实例
 * 在开发环境中，可以使用模拟数据
 * 在生产环境中，使用真实的后端服务
 */
export function useServices() {
  const [userService, setUserService] = useState<UserService | null>(null);
  const [messageService, setMessageService] = useState<MessageService | null>(null);
  const [authService, setAuthService] = useState<IAuthService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        
        // 初始化认证服务
        initializeAuthService();
        
        // 获取服务实例
        const userServiceInstance = UserService.getInstance();
        const messageServiceInstance = MessageService.getInstance();
        const authServiceInstance = AuthServiceFactory.getInstance().getAuthService();
        
        setUserService(userServiceInstance);
        setMessageService(messageServiceInstance);
        setAuthService(authServiceInstance);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize services:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };

    initializeServices();
  }, []);

  return { userService, messageService, authService, isLoading, error };
} 