/**
 * Firebase 实时监听器
 * 管理对 Firebase Realtime Database/Firestore 的实时数据订阅
 */

import {
  Firestore,
  doc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { DatabaseLogger, getDatabaseLogger } from '@/core/lib/db/errors/database-logger';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

/**
 * 监听器配置选项
 */
export interface ListenerOptions {
  /**
   * 是否将 Firebase 文档时间戳自动转换为 Date 对象
   * @default true
   */
  convertTimestamps?: boolean;
  
  /**
   * 是否包含元数据变更（本地缓存更新）
   * @default false
   */
  includeMetadataChanges?: boolean;
  
  /**
   * 监听错误回调函数
   */
  onError?: (error: Error) => void;
}

/**
 * 监听器信息
 */
interface ListenerInfo {
  /**
   * 取消监听函数
   */
  unsubscribe: () => void;
  
  /**
   * 监听类型
   */
  type: 'document' | 'collection';
  
  /**
   * 监听路径
   */
  path: string;
  
  /**
   * 创建时间
   */
  createdAt: Date;
}

/**
 * Firebase 实时监听器
 * 管理对 Firebase Firestore 的实时数据订阅
 */
export class RealtimeListener {
  private listeners: Map<string, ListenerInfo> = new Map();
  private logger: DatabaseLogger;
  
  /**
   * 创建 Firebase 实时监听器实例
   * @param db - Firestore 数据库实例
   */
  constructor(private db: Firestore) {
    this.logger = getDatabaseLogger('RealtimeListener');
  }
  
  /**
   * 获取监听器数量
   * @returns 活动监听器数量
   */
  public getActiveListenerCount(): number {
    return this.listeners.size;
  }
  
  /**
   * 获取所有监听器 ID
   * @returns 监听器 ID 数组
   */
  public getListenerIds(): string[] {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * 添加实体监听器
   * @param tableName - 表名
   * @param id - 实体 ID
   * @param callback - 数据变化回调函数
   * @param options - 监听器选项
   * @returns 监听器 ID
   */
  public addEntityListener<T extends BaseEntity>(
    tableName: string,
    id: string,
    callback: (data: T | null) => void,
    options: ListenerOptions = {}
  ): string {
    const listenerId = `${tableName}_${id}_${Date.now()}`;
    const docRef = doc(this.db, tableName, id);
    
    this.logger.debug(`添加实体监听器: ${tableName}/${id}`);
    
    // 设置监听
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: options.includeMetadataChanges || false },
      (snapshot: DocumentSnapshot) => {
        try {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }
          
          const data = snapshot.data();
          if (!data) {
            callback(null);
            return;
          }
          
          const entity = this.convertDocumentData<T>(data, id, options);
          callback(entity);
        } catch (error) {
          this.logger.error(`监听器处理错误: ${listenerId}`, error);
          if (options.onError) {
            options.onError(error as Error);
          }
        }
      },
      (error: Error) => {
        this.logger.error(`监听器错误: ${listenerId}`, error);
        if (options.onError) {
          options.onError(error);
        }
      }
    );
    
    // 保存监听引用
    this.listeners.set(listenerId, {
      unsubscribe,
      type: 'document',
      path: `${tableName}/${id}`,
      createdAt: new Date()
    });
    
    return listenerId;
  }
  
  /**
   * 添加集合监听器
   * @param tableName - 表名
   * @param callback - 数据变化回调函数
   * @param queryConstraints - 查询条件
   * @param options - 监听器选项
   * @returns 监听器 ID
   */
  public addCollectionListener<T extends BaseEntity>(
    tableName: string,
    callback: (data: T[]) => void,
    queryConstraints: QueryConstraint[] = [],
    options: ListenerOptions = {}
  ): string {
    const listenerId = `${tableName}_collection_${Date.now()}`;
    const collectionRef = collection(this.db, tableName);
    const queryRef = query(collectionRef, ...queryConstraints);
    
    this.logger.debug(`添加集合监听器: ${tableName}`, { queryConstraints });
    
    // 设置监听
    const unsubscribe = onSnapshot(
      queryRef,
      { includeMetadataChanges: options.includeMetadataChanges || false },
      (snapshot: QuerySnapshot) => {
        try {
          if (snapshot.empty) {
            callback([]);
            return;
          }
          
          const results: T[] = [];
          snapshot.forEach((docSnapshot) => {
            const id = docSnapshot.id;
            const data = docSnapshot.data();
            
            if (data) {
              const entity = this.convertDocumentData<T>(data, id, options);
              results.push(entity);
            }
          });
          
          callback(results);
        } catch (error) {
          this.logger.error(`监听器处理错误: ${listenerId}`, error);
          if (options.onError) {
            options.onError(error as Error);
          }
        }
      },
      (error: Error) => {
        this.logger.error(`监听器错误: ${listenerId}`, error);
        if (options.onError) {
          options.onError(error);
        }
      }
    );
    
    // 保存监听引用
    this.listeners.set(listenerId, {
      unsubscribe,
      type: 'collection',
      path: tableName,
      createdAt: new Date()
    });
    
    return listenerId;
  }
  
  /**
   * 移除监听器
   * @param listenerId - 监听器 ID
   */
  public removeListener(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (!listener) {
      this.logger.warn(`尝试移除不存在的监听器: ${listenerId}`);
      return;
    }
    
    // 移除监听
    listener.unsubscribe();
    
    // 清理引用
    this.listeners.delete(listenerId);
    this.logger.debug(`已移除监听器: ${listenerId}`, { 
      type: listener.type, 
      path: listener.path 
    });
  }
  
  /**
   * 移除所有监听器
   */
  public removeAllListeners(): void {
    const count = this.listeners.size;
    if (count === 0) {
      return;
    }
    
    this.logger.debug(`移除所有监听器: ${count}个`);
    
    // 使用 Array.from 转换迭代器以避免ES5兼容性问题
    Array.from(this.listeners.entries()).forEach(([listenerId, listener]) => {
      listener.unsubscribe();
      this.listeners.delete(listenerId);
    });
    
    this.logger.info(`已移除所有监听器: ${count}个`);
  }
  
  /**
   * 将 Firestore 文档数据转换为实体
   * @param data 文档数据
   * @param id 文档 ID
   * @param options 转换选项
   * @returns 转换后的实体
   */
  private convertDocumentData<T extends BaseEntity>(
    data: DocumentData,
    id: string,
    options: ListenerOptions
  ): T {
    // 创建基础实体对象
    const entity = {
      id,
      ...data
    } as T;
    
    // 如果需要转换时间戳
    if (options.convertTimestamps !== false) {
      this.convertTimestamps(entity);
    }
    
    return entity;
  }
  
  /**
   * 将对象中的 Firestore 时间戳转换为 Date 对象
   * @param obj 要转换的对象
   */
  private convertTimestamps(obj: any): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    for (const key in obj) {
      const value = obj[key];
      
      // 检查是否是 Firestore 时间戳
      if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
        obj[key] = value.toDate();
      } 
      // 递归处理嵌套对象
      else if (value && typeof value === 'object') {
        this.convertTimestamps(value);
      }
    }
  }
} 