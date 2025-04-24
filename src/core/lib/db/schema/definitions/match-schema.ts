import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const matchSchema: TableSchema = {
  name: 'matchs',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userAId', type: ColumnType.STRING, notNull: true },
    { name: 'userBId', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userAId', columns: ["userAId"], unique: true },
    { name: 'idx_userBId', columns: ["userBId"], unique: true }
  ]
};

schemaRegistry.register(matchSchema);

export default matchSchema;
