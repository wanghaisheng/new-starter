import { getApp } from 'firebase/app';
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
  persistentMultipleTabManager,
  Firestore,
  DocumentData,
  CollectionReference,
  query,
  where,
  orderBy,
  limit,
  WhereFilterOp,
  OrderByDirection,
  writeBatch
} from 'firebase/firestore';


import { DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import { DatabaseLogger, getDatabaseLogger } from '@/core/lib/db/errors/database-logger';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { SyncStatus } from '@/core/lib/db/types/database';

import { FirebaseConfig } from './firebase-config';

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
  private db: Firestore;
  private listeners: Map<string, Set<SyncListener<any>>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  constructor(
    private config: FirebaseConfig,
    private options: SyncOptions = {}
  ) {
    this.initializeFirestore();
  }

  private async initializeFirestore() {
    try {
      // 配置 Firestore 设置
      const settings = {
        // 使用本地持久化缓存
        localCache: this.options.enableMultiTab 
          ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
          : persistentLocalCache({
              cacheSizeBytes: this.options.cacheSize || CACHE_SIZE_UNLIMITED
            })
      };

      // 初始化 Firestore - 使用已初始化的 Firebase 应用实例
      const app = getApp();
      this.db = initializeFirestore(app, settings);

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
    } catch (error) {
      // ... error handling
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
      
      // 获取集合引用
      const collectionRef: CollectionReference<DocumentData> = collection(this.db, collectionName);
      
      // 构建查询
      let firestoreQuery = query(collectionRef);
      
      if (queryOptions) {
        const { where: whereClauses, orderBy: orderByClauses, limit: limitValue } = queryOptions;
        
        // 添加 where 条件
        if (whereClauses) {
          whereClauses.forEach(({ field, operator, value }) => {
            firestoreQuery = query(firestoreQuery, where(field, operator as WhereFilterOp, value));
          });
        }

        // 添加 orderBy 条件
        if (orderByClauses) {
          orderByClauses.forEach(({ field, direction }) => {
            firestoreQuery = query(firestoreQuery, orderBy(field, direction as OrderByDirection));
          });
        }

        // 添加 limit 条件
        if (limitValue) {
          firestoreQuery = query(firestoreQuery, limit(limitValue));
        }
      }

      // 设置实时监听
      const unsubscribe = onSnapshot(
        firestoreQuery,
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
    Array.from(this.unsubscribeFunctions.values()).forEach(unsubscribe => {
      unsubscribe();
    });
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