import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const skinSchema: TableSchema = {
  name: 'skins',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'name', type: ColumnType.STRING, notNull: true },
    { name: 'previewUrl', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true }
  ]
};

schemaRegistry.register(skinSchema);

export default skinSchema;
