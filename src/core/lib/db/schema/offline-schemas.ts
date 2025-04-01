/**
 * 离线专用表结构定义
 * 此模块定义了仅在本地存储、从不与远程同步的表
 */
import { TableSchema, ColumnType } from './types';
import { SyncPriority, ConflictResolution } from '../types/sync-flags';
import { SchemaRegistry } from './schema-registry';

/**
 * 离线笔记表
 * 用于存储用户的本地笔记，不会同步到服务器
 */
export const offlineNotesSchema: TableSchema = {
  name: 'offline_notes',
  syncConfig: {
    enabled: true,
    offlineOnly: true, // 标记为仅离线存储
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    { name: 'id', type: ColumnType.STRING, primaryKey: true },
    { name: 'title', type: ColumnType.STRING, nullable: false },
    { name: 'content', type: ColumnType.TEXT, nullable: true },
    { name: 'createdAt', type: ColumnType.DATETIME, nullable: false },
    { name: 'updatedAt', type: ColumnType.DATETIME, nullable: false }
  ],
  indexes: [
    { name: 'idx_title', columns: ['title'], unique: false },
    { name: 'idx_created', columns: ['createdAt'], unique: false }
  ]
};

/**
 * 设备设置表
 * 用于存储仅对当前设备有效的设置，不会同步到其他设备
 */
export const deviceSettingsSchema: TableSchema = {
  name: 'device_settings',
  syncConfig: {
    enabled: true,
    offlineOnly: true,
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    { name: 'id', type: ColumnType.STRING, primaryKey: true },
    { name: 'settingKey', type: ColumnType.STRING, nullable: false },
    { name: 'settingValue', type: ColumnType.TEXT, nullable: true },
    { name: 'deviceId', type: ColumnType.STRING, nullable: false },
    { name: 'updatedAt', type: ColumnType.DATETIME, nullable: false }
  ],
  indexes: [
    { name: 'idx_setting_key', columns: ['settingKey'], unique: false },
    { name: 'idx_device', columns: ['deviceId'], unique: false }
  ]
};

/**
 * 草稿表
 * 用于存储用户的本地草稿，不会同步到服务器
 */
export const draftsSchema: TableSchema = {
  name: 'drafts',
  syncConfig: {
    enabled: true,
    offlineOnly: true,
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    { name: 'id', type: ColumnType.STRING, primaryKey: true },
    { name: 'entityType', type: ColumnType.STRING, nullable: false }, // 关联的实体类型
    { name: 'entityId', type: ColumnType.STRING, nullable: true }, // 关联的实体ID（如果有）
    { name: 'content', type: ColumnType.TEXT, nullable: true },
    { name: 'metadata', type: ColumnType.JSON, nullable: true },
    { name: 'createdAt', type: ColumnType.DATETIME, nullable: false },
    { name: 'updatedAt', type: ColumnType.DATETIME, nullable: false }
  ],
  indexes: [
    { name: 'idx_entity', columns: ['entityType', 'entityId'], unique: false },
    { name: 'idx_updated', columns: ['updatedAt'], unique: false }
  ]
};

/**
 * 所有离线表的集合
 */
export const offlineSchemas: TableSchema[] = [
  offlineNotesSchema,
  deviceSettingsSchema,
  draftsSchema
];

/**
 * 向模式注册表注册所有离线表
 * 注意：此函数设计为在index.ts中调用，不在此文件中自动执行
 * 这样避免循环依赖问题
 */
export function registerOfflineSchemas(): void {
  const registry = SchemaRegistry.getInstance();
  for (const schema of offlineSchemas) {
    registry.register(schema);
  }
}

// 不要在这里自动调用注册函数
// 注册将在index.ts中的初始化过程中处理 