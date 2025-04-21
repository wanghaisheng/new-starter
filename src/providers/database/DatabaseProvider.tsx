import React, { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import type { IDataService } from '@/core/services/data/types';

// 创建数据库服务上下文
export const DatabaseContext = createContext<IDataService | null>(null);

export function DatabaseProvider({ children }: PropsWithChildren<any>) {
  // 按需从 registry 获取当前环境的数据库服务实例
  const dbService = useMemo(() => DataServiceRegistry.get('database'), []);

  if (!dbService) {
    // 可以渲染 loading/error UI
    return <div>数据库服务初始化失败或未注册</div>;
  }

  return (
    <DatabaseContext.Provider value={dbService}>
      {children}
    </DatabaseContext.Provider>
  );
}

// 业务 hooks 可直接用
export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase 必须在 DatabaseProvider 内使用');
  return ctx;
}