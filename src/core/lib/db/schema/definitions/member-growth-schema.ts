import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const member-growthSchema: TableSchema = {
  name: 'member-growths',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'level', type: ColumnType.NUMBER, notNull: true },
    { name: 'exp', type: ColumnType.NUMBER, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true }
  ]
};

schemaRegistry.register(member-growthSchema);

export default member-growthSchema;
