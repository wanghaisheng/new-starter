import { schemaRegistry, TableSchema } from '../index';
import { SyncPriority, ConflictResolution } from '@/core/lib/db/types/sync-flags';

/**
 * 离线笔记表 - 示例表结构
 * 此表仅保存在本地设备，不会同步到云端
 */
const offlineNotesSchema: TableSchema = {
  name: 'offline_notes',
  // 配置同步行为 - 标记为仅离线存储
  syncConfig: {
    enabled: true, // 虽然启用了同步功能，但由于offlineOnly为true，实际上不会同步
    offlineOnly: true, // 标记该表为仅离线存储，不会同步到云端
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      required: true
    },
    {
      name: 'title',
      type: 'string',
      required: true
    },
    {
      name: 'content',
      type: 'text',
      required: true
    },
    {
      name: 'tags',
      type: 'json',
      default: '[]'
    },
    {
      name: 'isEncrypted',
      type: 'boolean',
      default: false
    },
    {
      name: 'deviceId',
      type: 'string',
      required: true,
      // description property doesn't exist in ColumnDefinition, removing it
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
      default: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      required: true,
      default: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_offline_notes_title',
      columns: ['title']
    },
    {
      name: 'idx_offline_notes_device',
      columns: ['deviceId']
    },
    {
      name: 'idx_offline_notes_created',
      columns: ['createdAt']
    }
  ]
};

// 注册表结构
schemaRegistry.register(offlineNotesSchema);

export default offlineNotesSchema; 