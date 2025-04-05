import { v4 as uuidv4 } from 'uuid';

import { SchemaRegistry } from '@/core/lib/db/schema/schema-registry';
import { TableSchema } from '@/core/lib/db/schema/types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

import { DatabaseService } from './database-service';


/**
 * 离线存储服务
 * 专门处理标记为离线专用的数据
 * 提供创建、读取、更新和删除仅存储在本地设备上的数据的功能
 */
export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private databaseService: DatabaseService;
  private schemaRegistry: SchemaRegistry;
  private _isInitialized = false;
  private offlineOnlyTables: string[] = [];

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.schemaRegistry = SchemaRegistry.getInstance();
  }

  public static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  /**
   * 初始化离线存储服务
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // 确保数据库服务已初始化
      await this.databaseService.initialize();
      
      // 获取所有离线专用表
      this.refreshOfflineTablesList();
      
      this._isInitialized = true;
    } catch (error) {
      console.error('Error initializing offline storage service:', error);
      throw error;
    }
  }

  /**
   * 刷新离线表列表
   */
  private refreshOfflineTablesList(): void {
    this.offlineOnlyTables = [];
    const allSchemas = this.schemaRegistry.getAllSchemas();
    
    for (const schema of allSchemas) {
      if (schema.syncConfig?.offlineOnly) {
        this.offlineOnlyTables.push(schema.name);
      }
    }
  }

  /**
   * 检查表是否标记为离线专用
   * @param tableName 表名
   * @returns 如果表配置为离线专用返回true，否则返回false
   */
  public isOfflineOnlyTable(tableName: string): boolean {
    // 先检查缓存
    if (this.offlineOnlyTables.includes(tableName)) {
      return true;
    }
    
    // 如果没有在缓存中找到，再检查模式
    const schema = this.schemaRegistry.getSchema(tableName);
    const isOfflineOnly = !!schema?.syncConfig?.offlineOnly;
    
    // 更新缓存
    if (isOfflineOnly) {
      this.offlineOnlyTables.push(tableName);
    }
    
    return isOfflineOnly;
  }

  /**
   * 创建离线专用实体
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @param data 实体数据
   * @returns 创建的实体
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async create<T extends BaseEntity>(tableName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 准备实体数据
    const now = new Date();
    const entityWithId = data as any;
    const entity = {
      ...entityWithId,
      id: entityWithId.id || this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;
    
    // 使用标准创建方法
    return this.databaseService.create<T>(tableName, entity);
  }

  /**
   * 获取离线专用实体
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @param id 实体ID
   * @returns 找到的实体
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async get<T extends BaseEntity>(tableName: string, id: string): Promise<T> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 使用标准获取方法
    return this.databaseService.get<T>(tableName, id);
  }

  /**
   * 获取所有离线专用实体
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @param filter 可选的过滤条件
   * @returns 实体列表
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async getAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 使用标准获取方法
    if (filter) {
      // 需要过滤，使用核心服务查询
      const client = this.databaseService.getDatabaseClient();
      const result = await client.query<T>(tableName, { where: filter });
      return Array.isArray(result) ? result : (result as any).data || [];
    }
    
    // 不需要过滤，使用标准方法
    return this.databaseService.getAll<T>(tableName);
  }

  /**
   * 更新离线专用实体
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @param id 实体ID
   * @param data 更新数据
   * @returns 更新后的实体
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<T> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 更新时间戳
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // 使用标准更新方法
    return this.databaseService.update<T>(tableName, id, updateData);
  }

  /**
   * 删除离线专用实体
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @param id 实体ID
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 使用标准删除方法
    await this.databaseService.delete(tableName, id);
  }

  /**
   * 批量创建离线专用实体
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @param items 实体数据数组
   * @returns 创建的实体数组
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async bulkCreate<T extends BaseEntity>(tableName: string, items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T[]> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 准备所有实体
    const now = new Date();
    const entities = items.map(item => {
      const entityWithId = item as any;
      return {
        ...entityWithId,
        id: entityWithId.id || this.generateId(),
        createdAt: now,
        updatedAt: now,
      };
    }) as T[];
    
    // 使用批量创建方法，如果可用
    if (typeof this.databaseService.bulkCreate === 'function') {
      return this.databaseService.bulkCreate<T>(tableName, entities);
    }
    
    // 批量创建
    const results: T[] = [];
    for (const entity of entities) {
      const result = await this.databaseService.create<T>(tableName, entity);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 为离线专用表创建备份
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @returns 包含表数据的JSON字符串
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async exportTableData(tableName: string): Promise<string> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 获取所有数据
    const data = await this.getAll(tableName);
    
    // 获取表模式
    const schema = this.schemaRegistry.getSchema(tableName);
    
    // 返回JSON字符串
    return JSON.stringify({
      tableName,
      schema: schema ? {
        name: schema.name,
        columns: schema.columns,
        indexes: schema.indexes,
        syncConfig: schema.syncConfig
      } : null,
      timestamp: new Date().toISOString(),
      data
    }, null, 2);
  }

  /**
   * 从备份恢复离线专用表数据
   * @param jsonData 包含表数据的JSON字符串
   * @param options 恢复选项
   * @returns 恢复的记录数
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async importTableData(jsonData: string, options: { clearExisting?: boolean; validateSchema?: boolean } = {}): Promise<number> {
    this.checkInitialized();
    
    try {
      // 解析JSON数据
      const parsedData = JSON.parse(jsonData);
      const { tableName, schema, data } = parsedData;
      
      // 验证表是否标记为离线专用
      this.validateOfflineTable(tableName);
      
      // 检查模式是否兼容（如果需要）
      if (options.validateSchema && schema) {
        const currentSchema = this.schemaRegistry.getSchema(tableName);
        if (!currentSchema) {
          throw new Error(`Schema for table '${tableName}' not found`);
        }
        
        // 可以进行更复杂的模式比较，但这里采用简单的名称和列数量验证
        if (currentSchema.name !== schema.name || 
            currentSchema.columns.length < schema.columns.length) {
          throw new Error(
            `Schema mismatch: Current schema may be incompatible with backup schema`
          );
        }
      }
      
      // 清空现有数据（如果需要）
      if (options.clearExisting) {
        // 获取现有数据并删除
        const existingData = await this.getAll(tableName);
        for (const item of existingData) {
          await this.delete(tableName, item.id);
        }
      }
      
      // 导入数据
      let importedCount = 0;
      for (const item of data) {
        await this.databaseService.create(tableName, item);
        importedCount++;
      }
      
      return importedCount;
    } catch (error) {
      console.error('Error importing table data:', error);
      throw error;
    }
  }

  /**
   * 检查所有离线表中有多少数据
   * @returns 一个对象，表名作为键，记录数作为值
   */
  public async getOfflineDataStats(): Promise<Record<string, number>> {
    this.checkInitialized();
    
    const stats: Record<string, number> = {};
    
    for (const tableName of this.offlineOnlyTables) {
      const data = await this.getAll(tableName);
      stats[tableName] = data.length;
    }
    
    return stats;
  }

  /**
   * 清空离线表数据
   * @param tableName 表名（必须在schema中标记为offlineOnly）
   * @throws 如果表未标记为离线专用则抛出错误
   */
  public async clearTable(tableName: string): Promise<void> {
    this.checkInitialized();
    
    // 验证表是否标记为离线专用
    this.validateOfflineTable(tableName);
    
    // 获取所有数据并删除
    const allData = await this.getAll(tableName);
    for (const item of allData) {
      await this.delete(tableName, item.id);
    }
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 检查离线存储服务是否已初始化
   * @throws 如果离线存储服务未初始化则抛出错误
   */
  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('Offline storage service is not initialized');
    }
  }
  
  /**
   * 验证表是否标记为离线专用
   * @param tableName 表名
   * @throws 如果表未标记为离线专用则抛出错误
   */
  private validateOfflineTable(tableName: string): void {
    if (!this.isOfflineOnlyTable(tableName)) {
      throw new Error(`Table '${tableName}' is not marked as offline-only. Use regular database service for this table.`);
    }
  }
  
  /**
   * 生成唯一ID
   * @returns 唯一ID字符串
   */
  private generateId(): string {
    return uuidv4();
  }
} 