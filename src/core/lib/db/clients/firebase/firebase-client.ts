/**
 * Firebase 数据库客户端
 * 基于 Firebase Firestore 的标准化数据库客户端实现
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  Firestore,
  initializeFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  writeBatch,
  onSnapshot,
  CACHE_SIZE_UNLIMITED,
  DocumentData,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  QueryConstraint,
  orderBy,
  limit
} from 'firebase/firestore';

import { BaseClient } from '@/core/lib/db/clients/base-client';
import { DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import { IDatabaseClient, IDatabaseTransaction } from '@/core/lib/db/interfaces';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import {
  BatchOperation, 
  QueryOptions, 
  QueryResult,
  DatabaseEvent,
} from '@/core/lib/db/types/database';
import { Match } from '@/core/lib/db/types/match';
import { Message } from '@/core/lib/db/types/message';
import { User } from '@/core/lib/db/types/user';

import { FirebaseConfig } from './firebase-config';

// 导入辅助类
import { 
  RealtimeListener,
  FirebaseQueryBuilder,
  FirebaseOfflineManager,
  FirebaseBatchProcessor,
  BatchOperationType,
  BatchOperationItem,
  BatchProcessorOptions,
  BatchProcessResult
} from './firebase-helpers';

/**
 * Firebase 数据库客户端类
 * 实现标准数据库客户端接口，基于 Firebase Firestore
 */
export class FirebaseClient extends BaseClient implements IDatabaseClient {
  private app: FirebaseApp | null = null;
  private db: Firestore;
  private queryBuilder: FirebaseQueryBuilder;
  private offlineManager: FirebaseOfflineManager | null = null;
  private realtimeListener: RealtimeListener | null = null;
  private batchProcessor: FirebaseBatchProcessor | null = null;

  /**
   * 构造函数
   * @param config Firebase 配置
   */
  constructor(
    private readonly firebaseConfig: FirebaseConfig
  ) {
    super();
    
    // 创建 Firebase 应用实例
    this.app = initializeApp(firebaseConfig.firebaseOptions);
    
    // 初始化 Firestore
    this.db = initializeFirestore(this.app, {
      ignoreUndefinedProperties: true,
      experimentalForceLongPolling: true,
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
    
    // 创建查询构建器
    this.queryBuilder = new FirebaseQueryBuilder();
    
    this.logger.debug('FirebaseClient 已创建');
  }
  
  /**
   * 初始化 Firebase 客户端
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Firebase 客户端已经初始化');
      return;
    }
    
    try {
      this.logger.info('初始化 Firebase 客户端');
      
      // 如果配置了 Firestore 模拟器，则连接
      if (this.firebaseConfig.firestore?.useEmulator) {
        const host = this.firebaseConfig.firestore.emulatorHost || 'localhost';
        const port = this.firebaseConfig.firestore.emulatorPort || 8080;
        
        this.logger.info(`连接 Firestore 模拟器: ${host}:${port}`);
        connectFirestoreEmulator(this.db, host, port);
      }
      
      // 创建实时监听器
      this.realtimeListener = new RealtimeListener(this.db);
      
      // 创建离线管理器
      this.offlineManager = new FirebaseOfflineManager(this.db, {
        enablePersistence: true,
        multiTabSupport: true,
        onNetworkStateChanged: (isOnline) => {
          this.emit(isOnline ? 'initialized' : 'closed');
        },
        onSyncStateChanged: (isSyncing) => {
          this.emit(isSyncing ? 'syncStarted' : 'syncCompleted');
        }
      });
      
      // 初始化离线管理
      await this.offlineManager.initialize();
      
      // 创建批处理器
      this.batchProcessor = new FirebaseBatchProcessor(this.db, {
        batchSize: 450,
        returnFailureDetails: true,
        onProgress: (processed, total, percentComplete) => {
          this.logger.debug(`批处理进度: ${processed}/${total} (${percentComplete}%)`);
        }
      });
      
      // 设置初始化标志
      this.initialized = true;
      this.emit('initialized');
      
      this.logger.info('Firebase 客户端初始化完成');
    } catch (error) {
      this.logger.error('初始化 Firebase 客户端失败', error);
      throw this.createError(
        DatabaseErrorCode.INITIALIZATION_ERROR,
        '初始化 Firebase 客户端失败',
        error
      );
    }
  }
  
  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    this.checkInitialized();
    
    try {
      this.logger.info('关闭 Firebase 客户端');
      
      // 移除所有监听器
      if (this.realtimeListener) {
        this.realtimeListener.removeAllListeners();
      }
      
      // 清理离线管理器
      if (this.offlineManager) {
        this.offlineManager.dispose();
      }
      
      // 设置初始化标志
      this.initialized = false;
      
      this.logger.info('Firebase 客户端已关闭');
    } catch (error) {
      this.logger.error('关闭 Firebase 客户端失败', error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '关闭 Firebase 客户端失败',
        error
      );
    }
  }
  
  /**
   * 清空数据库
   * 警告: 这将删除所有集合中的所有文档，谨慎使用
   */
  public async clear(): Promise<void> {
    this.checkInitialized();
    
    try {
      this.logger.warn('清空 Firebase 数据库，这将删除所有数据');
      
      // Firebase 没有直接的方法来清空数据库
      // 需要手动删除所有集合和文档
      const tables = Object.keys(this.firebaseConfig.tables || {});
      
      if (tables.length === 0) {
        this.logger.warn('没有配置任何表，无法清空数据库');
        return;
      }
      
      // 对每个集合执行删除操作
      for (const tableName of tables) {
        await this.clearCollection(tableName);
      }
      
      this.logger.info('Firebase 数据库已清空');
    } catch (error) {
      this.logger.error('清空 Firebase 数据库失败', error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '清空 Firebase 数据库失败',
        error
      );
    }
  }
  
  /**
   * 清空指定集合
   * @param tableName 集合名称
   */
  private async clearCollection(tableName: string): Promise<void> {
    try {
      this.logger.debug(`清空集合: ${tableName}`);
      
      // 获取集合引用
      const collectionRef = collection(this.db, tableName);
      
      // 查询所有文档
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        this.logger.debug(`集合 ${tableName} 为空，无需清空`);
        return;
      }
      
      // 使用批处理删除文档
      if (this.batchProcessor) {
        const operations: BatchOperationItem[] = [];
        
        snapshot.forEach(doc => {
          operations.push({
            type: BatchOperationType.DELETE,
            tableName,
            id: doc.id
          });
        });
        
        const batchResult = await this.batchProcessor.process(operations);
        
        this.logger.debug(`清空集合 ${tableName} 完成`, batchResult);
      } else {
        // 回退到手动删除
        const batch = writeBatch(this.db);
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      this.logger.error(`清空集合 ${tableName} 失败`, error);
      throw error;
    }
  }
  
  /**
   * 按 ID 查找实体
   * @param tableName 表名
   * @param id ID
   */
  public async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      const docRef = doc(this.db, tableName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data(),
        id: docSnap.id
      } as T;
    } catch (error) {
      this.logger.error(`查找实体失败 (${tableName}/${id})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查找实体失败 (${tableName}/${id})`,
        error
      );
    }
  }
  
  /**
   * 查找所有实体
   * @param tableName 表名
   * @param filter 过滤条件
   */
  public async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    // 调用 query 方法实现
    const result = await this.query<T>(tableName, { where: filter });
    return result.data;
  }
  
  /**
   * 创建实体
   * @param tableName 表名
   * @param data 实体数据
   */
  public async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    
    try {
      // 生成 ID
      const id = data.id || this.generateId();
      const docRef = doc(this.db, tableName, id);
      
      // 添加时间戳
      const entityWithTimestamps = this.addTimestamps({
        ...data,
        id
      });
      
      await setDoc(docRef, entityWithTimestamps);
      
      return entityWithTimestamps as T;
    } catch (error) {
      this.logger.error(`创建实体失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `创建实体失败 (${tableName})`,
        error
      );
    }
  }
  
  /**
   * 更新实体
   * @param tableName 表名
   * @param id ID
   * @param data 更新数据
   */
  public async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    
    try {
      const docRef = doc(this.db, tableName, id);
      
      // 添加时间戳 (仅 updatedAt)
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      this.logger.error(`更新实体失败 (${tableName}/${id})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `更新实体失败 (${tableName}/${id})`,
        error
      );
    }
  }
  
  /**
   * 删除实体
   * @param tableName 表名
   * @param id ID
   */
  public async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    try {
      const docRef = doc(this.db, tableName, id);
      await deleteDoc(docRef);
    } catch (error) {
      this.logger.error(`删除实体失败 (${tableName}/${id})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `删除实体失败 (${tableName}/${id})`,
        error
      );
    }
  }
  
  /**
   * 查询实体
   * @param tableName 表名
   * @param options 查询选项
   */
  public async query<T extends BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.checkInitialized();
    
    try {
      // 使用查询构建器创建 Firestore 查询
      const firestoreQuery = this.queryBuilder.buildFirestoreQuery(this.db, tableName, options);
      
      // 执行查询
      const snapshot = await getDocs(firestoreQuery);
      
      // 转换结果
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as T[];
      
      return {
        data,
        total: data.length,
        hasMore: false
      };
    } catch (error) {
      this.logger.error(`查询失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询失败 (${tableName})`,
        error
      );
    }
  }
  
  /**
   * 计数
   * @param tableName 表名
   * @param filter 过滤条件
   */
  public async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    
    try {
      // 使用 query 方法获取数据
      const result = await this.query(tableName, { where: filter });
      return result.total;
    } catch (error) {
      this.logger.error(`计数失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `计数失败 (${tableName})`,
        error
      );
    }
  }
  
  /**
   * 开始事务
   */
  public async beginTransaction(): Promise<void> {
    this.checkInitialized();
    
    if (this.transactionActive) {
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        '已有活动事务'
      );
    }
    
    this.transactionActive = true;
    this.logger.debug('开始事务');
  }
  
  /**
   * 提交事务
   */
  public async commitTransaction(): Promise<void> {
    this.checkInitialized();
    this.checkTransactionActive();
    
    this.transactionActive = false;
    this.logger.debug('提交事务');
  }
  
  /**
   * 回滚事务
   */
  public async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    this.checkTransactionActive();
    
    this.transactionActive = false;
    this.logger.debug('回滚事务');
  }
  
  /**
   * 批量操作
   * @param tableName 表名
   * @param operations 操作数组
   */
  public async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    
    if (operations.length === 0) {
      return;
    }
    
    try {
      if (this.batchProcessor) {
        // 使用批处理器
        const batchOperations: BatchOperationItem[] = operations.map(op => {
          return {
            type: op.type === 'add' ? BatchOperationType.CREATE :
                  op.type === 'put' ? BatchOperationType.UPDATE :
                  BatchOperationType.DELETE,
            tableName,
            id: op.data.id,
            data: op.type !== 'delete' ? op.data : undefined
          };
        });
        
        await this.batchProcessor.process(batchOperations);
      } else {
        // 回退到手动批处理
        const batch = writeBatch(this.db);
        
        for (const operation of operations) {
          const docRef = doc(this.db, tableName, operation.data.id);
          
          switch (operation.type) {
            case 'add':
              batch.set(docRef, this.addTimestamps(operation.data));
              break;
            case 'put':
              batch.update(docRef, this.addTimestamps(operation.data));
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }
        }
        
        await batch.commit();
      }
    } catch (error) {
      this.logger.error(`批量操作失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `批量操作失败 (${tableName})`,
        error
      );
    }
  }
  
  /**
   * 执行原始查询
   * @param query 查询字符串
   * @param params 查询参数
   */
  public async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.checkInitialized();
    
    throw this.createError(
      DatabaseErrorCode.OPERATION_FAILED,
      'Firebase 不支持原始 SQL 查询'
    );
  }
  
  /**
   * 事务操作
   * @param callback 事务回调
   */
  public async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    this.checkInitialized();
    
    try {
      // 使用 Firestore 的事务API
      return await runTransaction(this.db, async (transaction) => {
        // 实现事务接口适配器
        const tx: IDatabaseTransaction = {
          findById: async <T extends BaseEntity>(tableName: string, id: string): Promise<T | null> => {
            const docRef = doc(this.db, tableName, id);
            const docSnap = await transaction.get(docRef);
            
            if (!docSnap.exists()) {
              return null;
            }
            
            return {
              ...docSnap.data(),
              id: docSnap.id
            } as T;
          },
          
          findAll: async <T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> => {
            // Firestore 事务不支持直接执行查询
            throw this.createError(
              DatabaseErrorCode.OPERATION_FAILED,
              '事务中不支持 findAll 操作'
            );
          },
          
          create: async <T extends BaseEntity>(tableName: string, data: T): Promise<T> => {
            const id = data.id || this.generateId();
            const docRef = doc(this.db, tableName, id);
            
            const entityWithTimestamps = this.addTimestamps({
              ...data,
              id
            });
            
            transaction.set(docRef, entityWithTimestamps);
            
            return entityWithTimestamps as T;
          },
          
          update: async <T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> => {
            const docRef = doc(this.db, tableName, id);
            
            const updateData = {
              ...data,
              updatedAt: new Date()
            };
            
            transaction.update(docRef, updateData);
          },
          
          delete: async (tableName: string, id: string): Promise<void> => {
            const docRef = doc(this.db, tableName, id);
            transaction.delete(docRef);
          },
          
          query: async <T extends BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>> => {
            // Firestore 事务不支持直接执行查询
            throw this.createError(
              DatabaseErrorCode.OPERATION_FAILED,
              '事务中不支持 query 操作'
            );
          },
          
          batch: async <T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> => {
            for (const operation of operations) {
              const docRef = doc(this.db, tableName, operation.data.id);
              
              switch (operation.type) {
                case 'add':
                  transaction.set(docRef, this.addTimestamps(operation.data));
                  break;
                case 'put':
                  transaction.update(docRef, this.addTimestamps(operation.data));
                  break;
                case 'delete':
                  transaction.delete(docRef);
                  break;
              }
            }
          },
          
          executeRawQuery: async <T>(query: string, params?: any[]): Promise<T[]> => {
            throw this.createError(
              DatabaseErrorCode.OPERATION_FAILED,
              '事务中不支持原始查询'
            );
          },
          
          count: async (tableName: string, filter?: Record<string, any>): Promise<number> => {
            throw this.createError(
              DatabaseErrorCode.OPERATION_FAILED,
              '事务中不支持 count 操作'
            );
          }
        };
        
        return await callback(tx);
      });
    } catch (error) {
      this.logger.error('事务执行失败', error);
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        '事务执行失败',
        error
      );
    }
  }
  
  // 实体特定的方法
  
  /**
   * 查找用户
   * @param query 查询条件
   */
  public async findUsers(query?: any): Promise<User[]> {
    return this.findAll<User>('users', query);
  }
  
  /**
   * 查找匹配
   * @param query 查询条件
   */
  public async findMatches(query?: any): Promise<Match[]> {
    return this.findAll<Match>('matches', query);
  }
  
  /**
   * 查找消息
   * @param query 查询条件
   */
  public async findMessages(query?: any): Promise<Message[]> {
    return this.findAll<Message>('messages', query);
  }
  
  /**
   * 创建用户
   * @param data 用户数据
   */
  public async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.create<User>('users', data as User);
  }
  
  /**
   * 创建匹配
   * @param data 匹配数据
   */
  public async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    return this.create<Match>('matches', data as Match);
  }
  
  /**
   * 创建消息
   * @param data 消息数据
   */
  public async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return this.create<Message>('messages', data as Message);
  }
  
  /**
   * 更新用户
   * @param id 用户ID
   * @param data 更新数据
   */
  public async updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.update<User>('users', id, data);
  }

  /**
   * 更新匹配
   * @param id 匹配ID
   * @param data 更新数据
   */
  public async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    return this.update<Match>('matches', id, data);
  }

  /**
   * 更新消息
   * @param id 消息ID
   * @param data 更新数据
   */
  public async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    return this.update<Message>('messages', id, data);
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  public async deleteUser(id: string): Promise<void> {
    return this.delete('users', id);
  }

  /**
   * 删除匹配
   * @param id 匹配ID
   */
  public async deleteMatch(id: string): Promise<void> {
    return this.delete('matches', id);
  }

  /**
   * 删除消息
   * @param id 消息ID
   */
  public async deleteMessage(id: string): Promise<void> {
    return this.delete('messages', id);
  }
} 