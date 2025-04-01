/**
 * Firebase 批处理器
 * 用于处理大量数据的批量操作，解决 Firestore 批量操作的 500 条记录限制
 */

import {
  Firestore,
  writeBatch,
  deleteDoc,
  setDoc,
  updateDoc,
  doc,
  WriteBatch,
  DocumentReference,
  DocumentData,
  getDoc
} from 'firebase/firestore';
import { DatabaseLogger, getLogger } from '@/core/lib/db/errors/database-logger';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

/**
 * 批处理操作类型
 */
export enum BatchOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPSERT = 'upsert' // 如果存在则更新，否则创建
}

/**
 * 批处理操作项
 */
export interface BatchOperationItem<T = any> {
  /**
   * 操作类型
   */
  type: BatchOperationType;
  
  /**
   * 表名（集合名称）
   */
  tableName: string;
  
  /**
   * 记录ID
   */
  id: string;
  
  /**
   * 记录数据（对于 CREATE 和 UPDATE 操作必需）
   */
  data?: T;
  
  /**
   * 操作完成回调
   */
  onComplete?: () => void;
}

/**
 * 批处理结果
 */
export interface BatchProcessResult {
  /**
   * 成功处理的操作数量
   */
  successCount: number;
  
  /**
   * 失败的操作数量
   */
  failureCount: number;
  
  /**
   * 批处理数量
   */
  batchCount: number;
  
  /**
   * 执行时间（毫秒）
   */
  executionTime: number;
  
  /**
   * 失败的操作
   */
  failures?: Error[];
}

/**
 * 批处理器配置选项
 */
export interface BatchProcessorOptions {
  /**
   * 每批最大操作数量
   * Firestore 限制每批最多 500 个操作
   * @default 450
   */
  batchSize?: number;
  
  /**
   * 是否返回详细的失败信息
   * @default false
   */
  returnFailureDetails?: boolean;
  
  /**
   * 批处理进度回调
   * @param processed 已处理数量
   * @param total 总数量
   * @param percentComplete 完成百分比
   * @param currentBatch 当前批次
   * @param totalBatches 总批次
   */
  onProgress?: (
    processed: number, 
    total: number, 
    percentComplete: number, 
    currentBatch: number, 
    totalBatches: number
  ) => void;
}

/**
 * Firebase 批处理器
 * 用于处理大量数据的批量操作，自动分批处理以规避 Firestore 的 500 条记录限制
 */
export class FirebaseBatchProcessor {
  private logger: DatabaseLogger;
  private options: Required<BatchProcessorOptions>;
  
  /**
   * 创建批处理器实例
   * @param db Firestore 实例
   * @param options 配置选项
   */
  constructor(private db: Firestore, options: BatchProcessorOptions = {}) {
    this.logger = getLogger('FirebaseBatchProcessor');
    
    // 设置默认选项
    this.options = {
      batchSize: options.batchSize || 450, // 默认 450，给 Firestore 留一些余量
      returnFailureDetails: options.returnFailureDetails || false,
      onProgress: options.onProgress || (() => {})
    };
  }
  
  /**
   * 执行批量操作
   * @param operations 操作项数组
   * @returns 批处理结果
   */
  public async process<T extends BaseEntity>(operations: BatchOperationItem<T>[]): Promise<BatchProcessResult> {
    const startTime = Date.now();
    const totalCount = operations.length;
    let successCount = 0;
    let failureCount = 0;
    const failures: Error[] = [];
    
    if (totalCount === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        batchCount: 0,
        executionTime: 0
      };
    }
    
    this.logger.info(`开始批处理: ${totalCount} 个操作`);
    
    // 计算需要的批次数
    const batchSize = this.options.batchSize;
    const batchCount = Math.ceil(totalCount / batchSize);
    
    // 按批次处理
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, totalCount);
      const batchOperations = operations.slice(start, end);
      const currentBatchSize = batchOperations.length;
      
      this.logger.debug(`处理批次 ${batchIndex + 1}/${batchCount}: ${currentBatchSize} 个操作`);
      
      try {
        // 处理当前批次
        const batchResult = await this.processBatch(batchOperations);
        successCount += batchResult.successCount;
        failureCount += batchResult.failureCount;
        
        if (this.options.returnFailureDetails && batchResult.failures) {
          failures.push(...batchResult.failures);
        }
        
        // 调用进度回调
        const processedCount = Math.min((batchIndex + 1) * batchSize, totalCount);
        const percentComplete = Math.round((processedCount / totalCount) * 100);
        this.options.onProgress(
          processedCount, 
          totalCount, 
          percentComplete, 
          batchIndex + 1, 
          batchCount
        );
      } catch (error) {
        this.logger.error(`批次处理失败: ${batchIndex + 1}/${batchCount}`, error);
        
        if (error instanceof Error) {
          if (this.options.returnFailureDetails) {
            failures.push(error);
          }
          failureCount += currentBatchSize;
        } else {
          const wrappedError = new Error(`未知错误: ${JSON.stringify(error)}`);
          if (this.options.returnFailureDetails) {
            failures.push(wrappedError);
          }
          failureCount += currentBatchSize;
        }
      }
    }
    
    const executionTime = Date.now() - startTime;
    this.logger.info(`批处理完成: ${successCount} 成功, ${failureCount} 失败, 用时 ${executionTime}ms`);
    
    return {
      successCount,
      failureCount,
      batchCount,
      executionTime,
      failures: this.options.returnFailureDetails ? failures : undefined
    };
  }
  
  /**
   * 处理单个批次
   * @param operations 批次中的操作项
   * @returns 批次处理结果
   */
  private async processBatch<T>(operations: BatchOperationItem<T>[]): Promise<BatchProcessResult> {
    let successCount = 0;
    let failureCount = 0;
    const failures: Error[] = [];
    const batch = writeBatch(this.db);
    const upsertChecks: Array<{
      docRef: DocumentReference<DocumentData>;
      data: any;
      onComplete?: () => void;
    }> = [];
    
    // 首先处理 UPSERT 操作
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      if (operation.type === BatchOperationType.UPSERT) {
        if (!operation.data) {
          const error = new Error(`UPSERT 操作缺少数据: ${operation.tableName}/${operation.id}`);
          this.logger.error(error.message);
          
          if (this.options.returnFailureDetails) {
            failures.push(error);
          }
          
          failureCount++;
          continue;
        }
        
        // 收集 UPSERT 检查
        const docRef = doc(this.db, operation.tableName, operation.id);
        upsertChecks.push({
          docRef,
          data: operation.data,
          onComplete: operation.onComplete
        });
        
        // 从操作列表中移除 UPSERT 操作
        operations.splice(i, 1);
        i--; // 调整索引
      }
    }
    
    // 处理 UPSERT 检查
    if (upsertChecks.length > 0) {
      try {
        // 检查每个文档是否存在
        await Promise.all(upsertChecks.map(async ({ docRef, data, onComplete }) => {
          try {
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              // 更新现有文档
              batch.update(docRef, data);
            } else {
              // 创建新文档
              batch.set(docRef, data);
            }
            
            successCount++;
            if (onComplete) onComplete();
          } catch (error) {
            this.logger.error(`UPSERT 检查失败: ${docRef.path}`, error);
            
            if (this.options.returnFailureDetails && error instanceof Error) {
              failures.push(error);
            }
            
            failureCount++;
          }
        }));
      } catch (error) {
        this.logger.error(`UPSERT 批量检查失败`, error);
        
        if (this.options.returnFailureDetails && error instanceof Error) {
          failures.push(error);
        }
        
        failureCount += upsertChecks.length;
      }
    }
    
    // 处理其他操作
    try {
      for (const operation of operations) {
        const docRef = doc(this.db, operation.tableName, operation.id);
        
        switch (operation.type) {
          case BatchOperationType.CREATE:
            if (!operation.data) {
              const error = new Error(`CREATE 操作缺少数据: ${operation.tableName}/${operation.id}`);
              this.logger.error(error.message);
              
              if (this.options.returnFailureDetails) {
                failures.push(error);
              }
              
              failureCount++;
              continue;
            }
            
            batch.set(docRef, operation.data);
            break;
            
          case BatchOperationType.UPDATE:
            if (!operation.data) {
              const error = new Error(`UPDATE 操作缺少数据: ${operation.tableName}/${operation.id}`);
              this.logger.error(error.message);
              
              if (this.options.returnFailureDetails) {
                failures.push(error);
              }
              
              failureCount++;
              continue;
            }
            
            batch.update(docRef, operation.data);
            break;
            
          case BatchOperationType.DELETE:
            batch.delete(docRef);
            break;
            
          default:
            const error = new Error(`未知操作类型: ${operation.type}`);
            this.logger.error(error.message);
            
            if (this.options.returnFailureDetails) {
              failures.push(error);
            }
            
            failureCount++;
            continue;
        }
        
        successCount++;
        if (operation.onComplete) operation.onComplete();
      }
      
      // 提交批处理
      await batch.commit();
    } catch (error) {
      this.logger.error('批处理提交失败', error);
      
      if (this.options.returnFailureDetails && error instanceof Error) {
        failures.push(error);
      }
      
      // 所有操作都失败
      failureCount += operations.length;
      successCount = 0;
    }
    
    return {
      successCount,
      failureCount,
      batchCount: 1,
      executionTime: 0,
      failures: this.options.returnFailureDetails ? failures : undefined
    };
  }
  
  /**
   * 创建批量操作项
   * @param type 操作类型
   * @param tableName 表名
   * @param id 记录ID
   * @param data 记录数据
   * @param onComplete 完成回调
   * @returns 批量操作项
   */
  public static createOperation<T>(
    type: BatchOperationType,
    tableName: string,
    id: string,
    data?: T,
    onComplete?: () => void
  ): BatchOperationItem<T> {
    return {
      type,
      tableName,
      id,
      data,
      onComplete
    };
  }
} 