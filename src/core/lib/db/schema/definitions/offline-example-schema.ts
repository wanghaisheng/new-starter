import { SyncPriority, ConflictResolution } from '@/core/lib/db/types/sync-flags';
import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

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
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'title',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'content',
      type: ColumnType.TEXT,
      notNull: true
    },
    {
      name: 'tags',
      type: ColumnType.JSON,
      defValue: '[]'
    },
    {
      name: 'isEncrypted',
      type: ColumnType.BOOLEAN,
      defValue: false
    },
    {
      name: 'deviceId',
      type: ColumnType.STRING,
      notNull: true
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