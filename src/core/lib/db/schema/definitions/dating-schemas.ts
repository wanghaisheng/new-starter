import { schemaRegistry, TableSchema } from '../index';

export const photoSchema: TableSchema = {
  name: 'photos',
  columns: [
    { name: 'id', type: 'string', primaryKey: true, notNull: true },
    { name: 'userId', type: 'string', notNull: true },
    { name: 'url', type: 'string', notNull: true },
    { name: 'order', type: 'number', notNull: true },
    { name: 'isMain', type: 'boolean', notNull: true, defaultValue: false },
    { name: 'createdAt', type: 'date', notNull: true },
    { name: 'updatedAt', type: 'date', notNull: true }
  ],
  indexes: [
    { name: 'idx_photos_user', columns: ['userId'] },
    { name: 'idx_photos_main', columns: ['userId', 'isMain'] }
  ]
};

export const matchActionSchema: TableSchema = {
  name: 'match_actions',
  columns: [
    { name: 'id', type: 'string', primaryKey: true, notNull: true },
    { name: 'userId', type: 'string', notNull: true },
    { name: 'targetUserId', type: 'string', notNull: true },
    { name: 'action', type: 'string', notNull: true },
    { name: 'createdAt', type: 'date', notNull: true },
    { name: 'updatedAt', type: 'date', notNull: true }
  ],
  indexes: [
    { name: 'idx_match_actions_user', columns: ['userId'] },
    { name: 'idx_match_actions_target', columns: ['targetUserId'] }
  ]
};

export const reportSchema: TableSchema = {
  name: 'reports',
  columns: [
    { name: 'id', type: 'string', primaryKey: true, notNull: true },
    { name: 'reporterId', type: 'string', notNull: true },
    { name: 'targetUserId', type: 'string', notNull: true },
    { name: 'reason', type: 'string', notNull: true },
    { name: 'details', type: 'text' },
    { name: 'status', type: 'string', notNull: true, defaultValue: 'pending' },
    { name: 'resolution', type: 'text' },
    { name: 'createdAt', type: 'date', notNull: true },
    { name: 'updatedAt', type: 'date', notNull: true }
  ],
  indexes: [
    { name: 'idx_reports_reporter', columns: ['reporterId'] },
    { name: 'idx_reports_target', columns: ['targetUserId'] },
    { name: 'idx_reports_status', columns: ['status'] }
  ]
};

export const blockSchema: TableSchema = {
  name: 'blocks',
  columns: [
    { name: 'id', type: 'string', primaryKey: true, notNull: true },
    { name: 'blockerId', type: 'string', notNull: true },
    { name: 'blockedId', type: 'string', notNull: true },
    { name: 'reason', type: 'text' },
    { name: 'expiresAt', type: 'date' },
    { name: 'createdAt', type: 'date', notNull: true },
    { name: 'updatedAt', type: 'date', notNull: true }
  ],
  indexes: [
    { name: 'idx_blocks_unique', columns: ['blockerId', 'blockedId'], unique: true },
    { name: 'idx_blocks_blocker', columns: ['blockerId'] },
    { name: 'idx_blocks_blocked', columns: ['blockedId'] },
    { name: 'idx_blocks_expires', columns: ['expiresAt'] }
  ]
}; 

// 注册所有dating相关的表结构
schemaRegistry.register(photoSchema);
schemaRegistry.register(matchActionSchema);
schemaRegistry.register(reportSchema);
schemaRegistry.register(blockSchema);

// 导出所有schema
export default {
  photoSchema,
  matchActionSchema,
  reportSchema,
  blockSchema
};