import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const member-growth-taskSchema: TableSchema = {
  name: 'member-growth-tasks',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'taskId', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'progress', type: ColumnType.NUMBER, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true },
    { name: 'idx_taskId', columns: ["taskId"], unique: true }
  ]
};

schemaRegistry.register(member-growth-taskSchema);

export default member-growth-taskSchema;
