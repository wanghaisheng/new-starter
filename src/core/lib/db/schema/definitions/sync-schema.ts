/**
 * 同步元数据表定义
 * 用于数据库离线存储和同步功能
 */
import { schemaRegistry } from '../index';
import { TableSchema } from '../types';
import { SyncState, SyncPriority, ConflictResolution } from '../../types/sync-flags';

/**
 * 同步元数据表结构
 * 定义了存储同步状态和元数据的字段
 */
export const syncMetadataSchema: TableSchema = {
  name: 'sync_metadata',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      required: true
    },
    {
      name: 'entityType',
      type: 'string',
      required: true,
      isSyncField: true
    },
    {
      name: 'entityId',
      type: 'string',
      required: true,
      isSyncField: true
    },
    {
      name: 'syncState',
      type: 'string',
      required: true,
      default: SyncState.NEW,
      isSyncField: true
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      isSyncField: true
    },
    {
      name: 'localModifiedAt',
      type: 'date',
      required: true,
      isSyncField: true
    },
    {
      name: 'remoteModifiedAt',
      type: 'date',
      isSyncField: true
    },
    {
      name: 'syncAttempts',
      type: 'number',
      default: 0,
      isSyncField: true
    },
    {
      name: 'syncPriority',
      type: 'string',
      required: true,
      default: SyncPriority.MEDIUM,
      isSyncField: true
    },
    {
      name: 'version',
      type: 'string',
      isSyncField: true
    },
    {
      name: 'conflictResolution',
      type: 'string',
      default: ConflictResolution.SERVER_WINS,
      isSyncField: true
    },
    {
      name: 'deviceId',
      type: 'string',
      isSyncField: true
    },
    {
      name: 'meta',
      type: 'json',
      isSyncField: true
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true
    },
    {
      name: 'updatedAt',
      type: 'date',
      required: true
    }
  ],
  indexes: [
    {
      name: 'idx_sync_metadata_entity',
      columns: ['entityType', 'entityId']
    },
    {
      name: 'idx_sync_metadata_state',
      columns: ['syncState']
    },
    {
      name: 'idx_sync_metadata_priority',
      columns: ['syncPriority']
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