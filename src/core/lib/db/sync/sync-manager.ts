/**
 * 同步管理器
 * 管理实体同步状态和与远程服务器的同步
 */
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity, SyncableBaseEntity } from '@/core/lib/db/types/base-entity';
import { 
  SyncState, 
  SyncPriority, 
  ConflictResolution, 
  SyncMetadata, 
  SyncConfig 
} from '@/core/lib/db/types/sync-flags';
import { DatabaseClient } from '@/core/lib/db/types/database';
import { NetworkManager } from '/network/network-manager';

export interface SyncManagerOptions {
  client: DatabaseClient;
  networkManager?: NetworkManager;
  entityTypes: string[];
  defaultConfig?: SyncConfig;
  autoSyncOnConnect?: boolean;
  syncIntervalMs?: number;
  deviceId?: string;
}

export class SyncManager {
  private client: DatabaseClient;
  private networkManager?: NetworkManager;
  private entityTypes: string[];
  private defaultConfig: SyncConfig;
  private deviceId: string;
  private syncInterval?: NodeJS.Timeout;
  private isSyncing: boolean = false;
  private autoSyncOnConnect: boolean;

  constructor(options: SyncManagerOptions) {
    this.client = options.client;
    this.networkManager = options.networkManager;
    this.entityTypes = options.entityTypes;
    this.deviceId = options.deviceId || uuidv4();
    this.autoSyncOnConnect = options.autoSyncOnConnect ?? true;
    
    // 默认同步配置
    this.defaultConfig = options.defaultConfig || {
      enabled: true,
      defaultPriority: SyncPriority.MEDIUM,
      defaultConflictResolution: ConflictResolution.SERVER_WINS,
      syncInterval: 60000, // 1分钟
      maxRetries: 5,
      retryDelay: 30000, // 30秒
      batchSize: 50,
      retentionAfterDelete: 604800000 // 7天
    };

    // 如果有网络管理器，监听网络状态变化
    if (this.networkManager) {
      this.networkManager.onConnect(() => {
        if (this.autoSyncOnConnect) {
          this.sync();
        }
      });
    }

    // 如果指定了同步间隔，启动定时同步
    if (options.syncIntervalMs) {
      this.startAutoSync(options.syncIntervalMs);
    }
  }

  /**
   * 标记实体为需要同步
   * @param entity 需要同步的实体
   * @param entityType 实体类型
   * @param state 同步状态
   * @param priority 同步优先级
   */
  public async markForSync<T extends BaseEntity>(
    entity: T, 
    entityType: string,
    state: SyncState = SyncState.MODIFIED, 
    priority: SyncPriority = SyncPriority.MEDIUM
  ): Promise<SyncableBaseEntity> {
    // 检查表是否为离线专用
    const tableConfig = await this.getTableSyncConfig(entityType);
    
    // 如果是离线专用表，则不标记为需要同步，而是标记为已同步状态
    const syncState = tableConfig?.offlineOnly === true ? SyncState.SYNCED : state;
    
    const now = new Date();
    const syncMetadata: SyncMetadata = {
      syncState: syncState,
      localModifiedAt: now,
      syncPriority: priority,
      deviceId: this.deviceId,
      syncAttempts: 0
    };

    return {
      ...entity,
      _sync: syncMetadata
    } as SyncableBaseEntity;
  }

  /**
   * 开始定时同步
   * @param intervalMs 同步间隔（毫秒）
   */
  public startAutoSync(intervalMs: number = this.defaultConfig.syncInterval || 60000): void {
    // 清除可能已经存在的定时器
    this.stopAutoSync();
    
    // 创建新的定时器
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);
  }

  /**
   * 停止定时同步
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  /**
   * 同步所有待同步的实体
   */
  public async sync(): Promise<void> {
    // 防止多个同步操作同时运行
    if (this.isSyncing) {
      console.log('同步已在进行中，跳过本次同步');
      return;
    }

    try {
      this.isSyncing = true;
      
      // 检查网络连接
      if (this.networkManager && !this.networkManager.isConnected()) {
        console.log('网络未连接，同步已取消');
        return;
      }

      // 对所有注册的实体类型进行同步
      for (const entityType of this.entityTypes) {
        await this.syncEntityType(entityType);
      }
    } catch (error) {
      console.error('同步过程中发生错误:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步指定类型的实体
   * @param entityType 实体类型
   */
  private async syncEntityType(entityType: string): Promise<void> {
    try {
      // 获取表的同步配置
      const tableConfig = await this.getTableSyncConfig(entityType);
      
      // 如果表被标记为仅离线存储，则跳过同步
      if (tableConfig?.offlineOnly === true) {
        console.log(`表 ${entityType} 被标记为仅离线存储，跳过同步`);
        return;
      }
      
      // 获取所有需要同步的实体
      const pendingEntities = await this.getPendingEntities(entityType);
      
      if (pendingEntities.length === 0) {
        return;
      }

      console.log(`开始同步 ${entityType}, 共 ${pendingEntities.length} 条记录`);

      // 按批次同步
      const batchSize = this.defaultConfig.batchSize || 50;
      const batches = this.splitIntoBatches(pendingEntities, batchSize);

      for (const batch of batches) {
        await this.syncBatch(entityType, batch);
      }
    } catch (error) {
      console.error(`同步 ${entityType} 时发生错误:`, error);
    }
  }

  /**
   * 获取表的同步配置
   * @param entityType 实体类型
   */
  private async getTableSyncConfig(entityType: string): Promise<SyncConfig | undefined> {
    // 从 schema 注册表中获取表的配置
    // 这里需要与你的 schema 注册表实现集成
    try {
      const { SchemaRegistry } = await import('@/core/lib/db/schema/schema-registry');
      const registry = SchemaRegistry.getInstance();
      const schema = registry.getSchema(entityType);
      return schema?.syncConfig;
    } catch (error) {
      console.error(`获取表 ${entityType} 同步配置失败:`, error);
      return undefined;
    }
  }

  /**
   * 获取所有待同步的实体
   * @param entityType 实体类型
   */
  private async getPendingEntities(entityType: string): Promise<SyncableBaseEntity[]> {
    // 查询所有非同步状态的实体
    const result = await this.client.query(entityType, {
      where: {
        field: '_sync.syncState',
        operator: 'in',
        value: [SyncState.NEW, SyncState.MODIFIED, SyncState.DELETED]
      },
      orderBy: {
        field: '_sync.syncPriority',
        direction: 'asc'
      }
    });
    
    return result.data as SyncableBaseEntity[];
  }

  /**
   * 按批次分割实体列表
   * @param entities 实体列表
   * @param batchSize 批次大小
   */
  private splitIntoBatches<T>(entities: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < entities.length; i += batchSize) {
      batches.push(entities.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 同步一批实体
   * @param entityType 实体类型
   * @param batch 实体批次
   */
  private async syncBatch(entityType: string, batch: SyncableBaseEntity[]): Promise<void> {
    // TODO: 实现实际的远程同步逻辑
    // 这里应该调用API服务将数据发送到远程服务器
    // 以下是示例实现

    // 模拟远程同步
    for (const entity of batch) {
      if (!entity._sync) continue;

      switch (entity._sync.syncState) {
        case SyncState.NEW:
          // 模拟创建操作
          await this.simulateRemoteOperation(entity, 'create');
          break;
        case SyncState.MODIFIED:
          // 模拟更新操作
          await this.simulateRemoteOperation(entity, 'update');
          break;
        case SyncState.DELETED:
          // 模拟删除操作
          await this.simulateRemoteOperation(entity, 'delete');
          break;
        default:
          // 其他状态不处理
          break;
      }
    }
  }

  /**
   * 模拟远程操作
   * 在实际实现中，这应该是对远程API的实际调用
   */
  private async simulateRemoteOperation(
    entity: SyncableBaseEntity, 
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // 模拟成功率 95%
    const isSuccess = Math.random() < 0.95;
    
    if (isSuccess) {
      // 模拟成功
      const syncData = {
        ...entity._sync,
        syncState: SyncState.SYNCED,
        lastSyncedAt: new Date(),
        remoteModifiedAt: new Date(),
        syncAttempts: (entity._sync?.syncAttempts || 0) + 1
      };

      // 更新实体同步状态
      await this.client.update(
        entity.constructor.name || entity._tableName || 'unknown',
        entity.id.toString(), 
        {
          ...entity,
          _sync: syncData
        }
      );

      console.log(`${operation} 操作成功同步实体: ${entity.id}`);
    } else {
      // 模拟失败
      const syncData = {
        ...entity._sync,
        syncState: SyncState.FAILED,
        syncAttempts: (entity._sync?.syncAttempts || 0) + 1
      };

      // 更新实体同步状态
      await this.client.update(
        entity.constructor.name || entity._tableName || 'unknown',
        entity.id.toString(), 
        {
          ...entity,
          _sync: syncData
        }
      );

      console.log(`${operation} 操作同步失败: ${entity.id}`);
    }
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.stopAutoSync();
    
    // 清除网络事件监听
    if (this.networkManager) {
      // TODO: 清除事件监听
    }
  }
} 