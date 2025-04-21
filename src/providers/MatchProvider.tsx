import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { MatchServiceRegistry } from '@/core/services/business/match/registry/match-service-registry';
import type { IMatchService } from '@/core/services/business/match/types/match-service';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';

export const MatchContext = createContext<IMatchService | null>(null);

export const MatchProvider = ({ children }: { children: ReactNode }) => {
  // 获取全局数据服务实例
  const dataService = DataServiceRegistry.get('default');
  // 推荐统一用 remote，后续可通过 env 配置
  const matchService = useMemo(() => {
    return MatchServiceRegistry.getInstance().createService('remote', 'default', dataService!);
  }, [dataService]);
  return (
    <MatchContext.Provider value={matchService}>
      {children}
    </MatchContext.Provider>
  );
};

export function useMatchService(): IMatchService {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('MatchService 未注入，请确保组件被 MatchProvider 包裹');
  return ctx;
}
