import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useState,
  useEffect
} from 'react';
import { DataInitializerService } from '@/core/services/infrastructure/data-initializer/data-initializer.service';
import type { IDataService } from '@/core/services/data/types';

// 创建数据库服务上下文
export const DatabaseContext = createContext<IDataService | null>(null);

export function DatabaseProvider({ children }: PropsWithChildren<any>) {
  const [dbService, setDbService] = useState<IDataService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDatabase() {
      try {
        // 1. 初始化数据库（支持多种模式，自动适配环境）
        const initializer = new DataInitializerService();
        await initializer.initialize();
        // 2. 获取已初始化的 db client
        const dbClient = initializer.getClient();
        if (!dbClient) {
          setError('数据库初始化后未获得数据服务实例');
        } else {
          setDbService(dbClient);
        }
      } catch (e: any) {
        setError(e?.message || '数据库初始化异常');
      } finally {
        setLoading(false);
      }
    }
    initDatabase();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }
  if (loading || !dbService) {
    return <div>数据库服务加载中...</div>;
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