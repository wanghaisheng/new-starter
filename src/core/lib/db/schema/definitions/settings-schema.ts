import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const settingsSchema: TableSchema = {
  name: 'settingss',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'key', type: ColumnType.STRING, notNull: true },
    { name: 'value', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true }
  ]
};

schemaRegistry.register(settingsSchema);

export default settingsSchema;
