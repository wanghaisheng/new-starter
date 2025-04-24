import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const global-configSchema: TableSchema = {
  name: 'global-configs',
  columns: [
    { name: 'key', type: ColumnType.STRING, notNull: true },
    { name: 'value', type: ColumnType.JSON, notNull: true },
    { name: 'description', type: ColumnType.STRING, notNull: false },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [

  ]
};

schemaRegistry.register(global-configSchema);

export default global-configSchema;
