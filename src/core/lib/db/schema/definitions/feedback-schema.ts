import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const feedbackSchema: TableSchema = {
  name: 'feedbacks',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'type', type: ColumnType.STRING, notNull: true },
    { name: 'content', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true }
  ]
};

schemaRegistry.register(feedbackSchema);

export default feedbackSchema;
