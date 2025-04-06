/**
 * 同步元数据表定义
 * 用于数据库离线存储和同步功能
 */
import { schemaRegistry } from '@/core/lib/db/schema/index';
import { TableSchema } from '@/core/lib/db/schema/types';
import { ColumnType } from '@/core/lib/db/schema/types';
import { SyncState, SyncPriority, ConflictResolution } from '@/core/lib/db/types/sync-flags';

/**
 * 同步元数据表结构
 * 定义了存储同步状态和元数据的字段
 */
export const syncMetadataSchema: TableSchema = {
  name: 'sync_metadata',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'entityType',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'entityId',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'syncState',
      type: ColumnType.STRING,
      notNull: true,
      defValue: SyncState.NEW
    },
    {
      name: 'lastSyncedAt',
      type: ColumnType.DATE
    },
    {
      name: 'localModifiedAt',
      type: ColumnType.DATE,
      notNull: true
    },
    {
      name: 'remoteModifiedAt',
      type: ColumnType.DATE
    },
    {
      name: 'syncAttempts',
      type: ColumnType.NUMBER,
      defValue: 0
    },
    {
      name: 'syncPriority',
      type: ColumnType.STRING,
      notNull: true,
      defValue: SyncPriority.MEDIUM
    },
    {
      name: 'version',
      type: ColumnType.STRING
    },
    {
      name: 'conflictResolution',
      type: ColumnType.STRING,
      defValue: ConflictResolution.SERVER_WINS
    },
    {
      name: 'deviceId',
      type: ColumnType.STRING
    },
    {
      name: 'meta',
      type: ColumnType.JSON
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_sync_metadata_entity',
      columns: ['entityType', 'entityId'],
      unique: true
    },
    {
      name: 'idx_sync_metadata_state',
      columns: ['syncState']
    },
    {
      name: 'idx_sync_metadata_priority',
      columns: ['syncPriority']
    },
    {
      name: 'idx_sync_metadata_device',
      columns: ['deviceId']
    }
  ],
  syncConfig: {
    enabled: true,
    defaultPriority: SyncPriority.MEDIUM,
    defaultConflictResolution: ConflictResolution.SERVER_WINS,
    syncInterval: 60000, // 1分钟
    maxRetries: 5,
    retryDelay: 30000, // 30秒
    batchSize: 50,
    retentionAfterDelete: 604800000 // 7天
  }
};

// 注册同步元数据表结构
schemaRegistry.register(syncMetadataSchema); 