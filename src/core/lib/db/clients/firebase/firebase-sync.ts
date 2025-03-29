import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { FirebaseConfig } from './firebase-client';
import { BaseEntity } from '../../interfaces';

export interface SyncOptions {
  enableOfflineCache?: boolean;
  enableMultiTab?: boolean;
  cacheSize?: number;
}

export interface SyncListener<T extends BaseEntity> {
  onData: (data: T[]) => void;
  onError: (error: Error) => void;
}

export class FirebaseSyncService {
  private db;
  private listeners: Map<string, Set<SyncListener<any>>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  constructor(
    private config: FirebaseConfig,
    private options: SyncOptions = {}
  ) {
    this.initializeFirestore();
  }

  private async initializeFirestore() {
    const settings = {
      cacheSizeBytes: this.options.cacheSize || CACHE_SIZE_UNLIMITED,
      localCache: persistentLocalCache({
        tabManager: this.options.enableMultiTab 
          ? persistentMultipleTabManager()
          : undefined
      })
    };

    this.db = initializeFirestore(this.config, settings);

    if (this.options.enableOfflineCache) {
      try {
        if (this.options.enableMultiTab) {
          await enableMultiTabIndexedDbPersistence(this.db);
        } else {
          await enableIndexedDbPersistence(this.db);
        }
      } catch (error) {
        console.warn('Failed to enable offline persistence:', error);
      }
    }
  }

  async subscribe<T extends BaseEntity>(
    collectionName: string,
    listener: SyncListener<T>,
    queryOptions?: {
      where?: { field: string; operator: string; value: any }[];
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
    }
  ): Promise<() => void> {
    try {
      // 存储监听器
      if (!this.listeners.has(collectionName)) {
        this.listeners.set(collectionName, new Set());
      }
      this.listeners.get(collectionName)!.add(listener);

      // 创建查询
      const collectionRef = collection(this.db, collectionName);
      let query = collectionRef;

      // 应用查询选项
      if (queryOptions) {
        const { where: whereClauses, orderBy: orderByClauses, limit: limitValue } = queryOptions;
        
        if (whereClauses) {
          whereClauses.forEach(({ field, operator, value }) => {
            query = query.where(field, operator as any, value);
          });
        }

        if (orderByClauses) {
          orderByClauses.forEach(({ field, direction }) => {
            query = query.orderBy(field, direction);
          });
        }

        if (limitValue) {
          query = query.limit(limitValue);
        }
      }

      // 设置实时监听
      const unsubscribe = onSnapshot(
        query,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          })) as T[];

          // 通知所有监听器
          this.listeners.get(collectionName)?.forEach(l => l.onData(data));
        },
        (error) => {
          // 通知所有监听器发生错误
          this.listeners.get(collectionName)?.forEach(l => l.onError(error));
        }
      );

      // 存储取消订阅函数
      const unsubscribeKey = `${collectionName}-${Math.random()}`;
      this.unsubscribeFunctions.set(unsubscribeKey, unsubscribe);

      // 返回取消订阅函数
      return () => {
        this.unsubscribeFunctions.get(unsubscribeKey)?.();
        this.unsubscribeFunctions.delete(unsubscribeKey);
        this.listeners.get(collectionName)?.delete(listener);
      };
    } catch (error) {
      listener.onError(error as Error);
      return () => {};
    }
  }

  async unsubscribeAll(): Promise<void> {
    // 取消所有订阅
    for (const unsubscribe of this.unsubscribeFunctions.values()) {
      unsubscribe();
    }
    this.unsubscribeFunctions.clear();
    this.listeners.clear();
  }

  // 获取缓存状态
  async getCacheStatus(collectionName: string): Promise<{
    size: number;
    lastSync: Date | null;
    isOnline: boolean;
  }> {
    // 注意：Firebase 不直接提供缓存状态 API
    // 这里返回一个模拟的状态
    return {
      size: 0,
      lastSync: null,
      isOnline: navigator.onLine
    };
  }

  // 清除缓存
  async clearCache(collectionName: string): Promise<void> {
    // 注意：Firebase 不直接提供清除缓存 API
    // 这里可以重新初始化 Firestore 实例
    await this.initializeFirestore();
  }
} 