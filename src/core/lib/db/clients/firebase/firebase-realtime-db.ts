/**
 * Firebase Realtime Database 客户端
 * 提供对 Firebase Realtime Database 的访问和操作
 */
import { getDatabase, ref, set, get, remove, update, query, orderByChild, 
         equalTo, startAt, endAt, limitToFirst, limitToLast, onValue, 
         off, push, Database, DatabaseReference, DataSnapshot, Query, 
         connectDatabaseEmulator } from 'firebase/database';
import { getApp } from 'firebase/app';
import { FirebaseConfig } from './firebase-config';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { QueryOptions, QueryResult } from '@/core/lib/db/types/database.types';
import { DatabaseLogger, getLogger } from '@/core/lib/db/errors/database-logger';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/errors/database-error';

/**
 * Realtime Database 监听器配置
 */
export interface RealtimeListenerConfig {
  /**
   * 是否包含初始数据
   * @default true
   */
  includeInitialData?: boolean;
  
  /**
   * 数据变更回调
   */
  onData: (data: any) => void;
  
  /**
   * 错误回调
   */
  onError?: (error: Error) => void;
}

/**
 * Firebase Realtime Database 客户端服务
 */
export class FirebaseRealtimeDBService {
  private db: Database;
  private logger: DatabaseLogger;
  private listeners: Map<string, RealtimeListenerConfig> = new Map();
  
  constructor(private config: FirebaseConfig) {
    this.logger = getLogger('FirebaseRealtimeDB');
    this.initialize();
  }
  
  /**
   * 初始化 Realtime Database
   */
  private initialize(): void {
    try {
      const app = getApp();
      this.db = getDatabase(app);
      
      // 检查是否需要连接到模拟器
      if (this.config.realtime?.useEmulator && 
          this.config.realtime.emulatorHost && 
          this.config.realtime.emulatorPort) {
        
        connectDatabaseEmulator(
          this.db, 
          this.config.realtime.emulatorHost, 
          this.config.realtime.emulatorPort
        );
        this.logger.info(`Connected to Realtime Database emulator at ${this.config.realtime.emulatorHost}:${this.config.realtime.emulatorPort}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to initialize Realtime Database', error);
      throw new DatabaseError(
        'Failed to initialize Realtime Database', 
        DatabaseErrorCode.INITIALIZATION_ERROR, 
        error
      );
    }
  }
  
  /**
   * 获取对象引用路径
   */
  private getRefPath(path: string, id?: string): string {
    return id ? `${path}/${id}` : path;
  }
  
  /**
   * 设置数据
   * @param path 数据路径
   * @param data 要保存的数据
   * @param id 可选的ID，如果提供则使用该ID，否则自动生成
   * @returns 数据ID
   */
  async set<T extends Record<string, any>>(path: string, data: T, id?: string): Promise<string> {
    try {
      let itemRef: DatabaseReference;
      let itemId: string;
      
      if (id) {
        itemRef = ref(this.db, this.getRefPath(path, id));
        itemId = id;
      } else {
        // 自动生成ID
        itemRef = push(ref(this.db, path));
        itemId = itemRef.key || '';
      }
      
      // 添加时间戳
      const timestampedData = {
        ...data,
        id: itemId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(itemRef, timestampedData);
      return itemId;
    } catch (error) {
      this.logger.error(`Failed to set data at ${path}`, error);
      throw new DatabaseError(
        `Failed to set data at ${path}`, 
        DatabaseErrorCode.OPERATION_FAILED, 
        error
      );
    }
  }
  
  /**
   * 获取数据
   * @param path 数据路径
   * @param id 数据ID，如果提供则获取单个对象，否则获取路径下的所有对象
   * @returns 数据对象或对象数组
   */
  async get<T>(path: string, id?: string): Promise<T | Record<string, T> | null> {
    try {
      const dataRef = ref(this.db, this.getRefPath(path, id));
      const snapshot = await get(dataRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      if (id) {
        // 单个对象
        return this.processDateFields(snapshot.val()) as T;
      } else {
        // 对象集合
        const data: Record<string, T> = {};
        snapshot.forEach((childSnapshot) => {
          data[childSnapshot.key as string] = this.processDateFields(childSnapshot.val()) as T;
        });
        return data;
      }
    } catch (error) {
      this.logger.error(`Failed to get data from ${path}`, error);
      throw new DatabaseError(
        `Failed to get data from ${path}`, 
        DatabaseErrorCode.OPERATION_FAILED, 
        error
      );
    }
  }
  
  /**
   * 更新数据
   * @param path 数据路径
   * @param id 数据ID
   * @param data 要更新的数据
   */
  async update<T>(path: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const dataRef = ref(this.db, this.getRefPath(path, id));
      
      // 添加更新时间戳
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await update(dataRef, updatedData);
    } catch (error) {
      this.logger.error(`Failed to update data at ${path}/${id}`, error);
      throw new DatabaseError(
        `Failed to update data at ${path}/${id}`, 
        DatabaseErrorCode.OPERATION_FAILED, 
        error
      );
    }
  }
  
  /**
   * 删除数据
   * @param path 数据路径
   * @param id 数据ID
   */
  async remove(path: string, id: string): Promise<void> {
    try {
      const dataRef = ref(this.db, this.getRefPath(path, id));
      await remove(dataRef);
    } catch (error) {
      this.logger.error(`Failed to remove data at ${path}/${id}`, error);
      throw new DatabaseError(
        `Failed to remove data at ${path}/${id}`, 
        DatabaseErrorCode.OPERATION_FAILED, 
        error
      );
    }
  }
  
  /**
   * 查询数据
   * @param path 数据路径
   * @param options 查询选项
   * @returns 查询结果
   */
  async query<T>(path: string, options: QueryOptions): Promise<QueryResult<T>> {
    try {
      const dbRef = ref(this.db, path);
      let dbQuery: Query = query(dbRef);
      
      // 应用查询条件
      if (options.where) {
        const whereOption = options.where;
        if ('field' in whereOption) {
          // 简单条件
          dbQuery = query(
            dbRef, 
            orderByChild(whereOption.field),
            this.mapOperator(whereOption.operator, whereOption.value)
          );
        }
      }
      
      // 应用排序
      if (options.orderBy) {
        dbQuery = query(dbRef, orderByChild(options.orderBy.field));
      }
      
      // 应用限制
      if (options.limit) {
        if (options.orderBy?.direction === 'desc') {
          dbQuery = query(dbQuery, limitToLast(options.limit));
        } else {
          dbQuery = query(dbQuery, limitToFirst(options.limit));
        }
      }
      
      // 获取数据
      const snapshot = await get(dbQuery);
      const results: T[] = [];
      
      snapshot.forEach((childSnapshot) => {
        results.push({
          ...this.processDateFields(childSnapshot.val()),
          id: childSnapshot.key
        } as unknown as T);
      });
      
      // 如果是降序排序，反转结果
      if (options.orderBy?.direction === 'desc') {
        results.reverse();
      }
      
      return {
        data: results,
        total: results.length,
        hasMore: false // Realtime Database 不支持分页计数
      };
    } catch (error) {
      this.logger.error(`Failed to query data at ${path}`, error);
      throw new DatabaseError(
        `Failed to query data at ${path}`, 
        DatabaseErrorCode.QUERY_ERROR, 
        error
      );
    }
  }
  
  /**
   * 添加实时数据监听
   * @param path 数据路径
   * @param config 监听配置
   * @returns 取消监听的函数
   */
  addListener(path: string, config: RealtimeListenerConfig): () => void {
    const dataRef = ref(this.db, path);
    const listenerId = `${path}-${Date.now()}`;
    
    // 保存监听配置
    this.listeners.set(listenerId, config);
    
    // 设置监听
    const callback = (snapshot: DataSnapshot) => {
      try {
        if (snapshot.exists()) {
          const data = this.processDateFields(snapshot.val());
          config.onData(data);
        } else {
          config.onData(null);
        }
      } catch (error) {
        if (config.onError) {
          config.onError(error as Error);
        }
      }
    };
    
    onValue(dataRef, callback);
    
    // 返回取消监听的函数
    return () => {
      off(dataRef);
      this.listeners.delete(listenerId);
    };
  }
  
  /**
   * 转换时间戳字段
   * @param data 数据对象
   * @returns 处理后的数据对象
   */
  private processDateFields(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'object') {
      // 处理数组
      if (Array.isArray(data)) {
        return data.map(item => this.processDateFields(item));
      }
      
      // 处理对象
      const result = { ...data };
      
      // 转换时间戳字段
      if (result.createdAt && typeof result.createdAt === 'string') {
        try {
          result.createdAt = new Date(result.createdAt);
        } catch (e) { /* 忽略错误 */ }
      }
      
      if (result.updatedAt && typeof result.updatedAt === 'string') {
        try {
          result.updatedAt = new Date(result.updatedAt);
        } catch (e) { /* 忽略错误 */ }
      }
      
      // 递归处理嵌套对象
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = this.processDateFields(result[key]);
        }
      });
      
      return result;
    }
    
    return data;
  }
  
  /**
   * 映射操作符到 Firebase Realtime Database 查询方法
   */
  private mapOperator(operator: string, value: any): any {
    switch (operator) {
      case '==':
      case '===':
      case 'eq':
        return equalTo(value);
      case '>':
      case 'gt':
        return startAt(value);
      case '>=':
      case 'gte':
        return startAt(value);
      case '<':
      case 'lt':
        return endAt(value);
      case '<=':
      case 'lte':
        return endAt(value);
      default:
        this.logger.warn(`Unsupported operator: ${operator}, falling back to equality`);
        return equalTo(value);
    }
  }
} 