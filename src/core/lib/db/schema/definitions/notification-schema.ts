import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const notificationSchema: TableSchema = {
  name: 'notifications',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'type', type: ColumnType.STRING, notNull: true },
    { name: 'title', type: ColumnType.STRING, notNull: true },
    { name: 'content', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true }
  ]
};

schemaRegistry.register(notificationSchema);

export default notificationSchema;
