import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

/**
 * 照片表结构定义
 * 定义照片实体的数据库结构
 */
const photoSchema: TableSchema = {
  name: 'photos',
  columns: [
    { name: 'id', type: ColumnType.STRING, primaryKey: true, notNull: true },
    { name: 'url', type: ColumnType.STRING, notNull: true },
    { name: 'order', type: ColumnType.NUMBER, notNull: true, defValue: 0 },
    { name: 'isMain', type: ColumnType.BOOLEAN, notNull: true, defValue: false },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'caption', type: ColumnType.TEXT },
    { name: 'tags', type: ColumnType.JSON, defValue: '[]' },
    { name: 'createdAt', type: ColumnType.DATE, notNull: true, defValue: () => new Date() },
    { name: 'updatedAt', type: ColumnType.DATE, notNull: true, defValue: () => new Date() },
  ],
  indexes: [
    { name: 'idx_photos_user', columns: ['userId'] },
    { name: 'idx_photos_is_main', columns: ['isMain'] },
    { name: 'idx_photos_order', columns: ['order'] },
  ]
};

schemaRegistry.register(photoSchema);

export default photoSchema;
