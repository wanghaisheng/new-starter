import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { UserService } from '@/core/services/business/user/user-service';
import { MatchService } from '@/core/services/business/match/match-service';
import { SettingService } from '@/core/services/business/user/setting-service';
import { QuizService } from '@/core/services/business/quiz/service/quiz-service';
import { PaymentService } from '@/core/services/infrastructure/payment/service/payment-service';
import { TranslationService } from '@/core/services/infrastructure/translation/service/translation-service';
import { LocationServiceRegistry } from '@/core/services/infrastructure/phone/location/registry/location-service-registry';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { DefaultMatchAIAdapter } from '@/core/services/business/match/ai-adapters/default-match-ai-adapter';

// 业务服务 context 类型
interface ServiceContextType {
  userService: UserService;
  matchService: MatchService;
  locationService: any;
  settingService: SettingService;
  quizService: QuizService;
  paymentService: PaymentService;
  translationService: TranslationService;
  // 可继续扩展其它 service
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  // 统一获取数据服务实例
  const dataService = useMemo(() => DataServiceRegistry.get('default'), []);
  if (!dataService) throw new Error('DataServiceRegistry default 实例未注册');

  const userService = useMemo(() => new UserService(), []);
  const matchAIAdapter = useMemo(() => new DefaultMatchAIAdapter(), []);
  const matchService = useMemo(() => new MatchService(dataService, matchAIAdapter, userService), [dataService, matchAIAdapter, userService]);
  // 基础服务采用工厂注册/Registry模式获取实例
  const locationService = useMemo(() => LocationServiceRegistry.getInstance().getDefaultService?.(), []);
  const settingService = useMemo(() => new SettingService(), []);
  const quizService = useMemo(() => new QuizService(), []);
  const paymentService = useMemo(() => new PaymentService(), []);
  const translationService = useMemo(() => new TranslationService(), []);

  return (
    <ServiceContext.Provider value={{
      userService,
      matchService,
      locationService,
      settingService,
      quizService,
      paymentService,
      translationService
    }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error('useService 必须在 ServiceProvider 内使用');
  return ctx;
}
