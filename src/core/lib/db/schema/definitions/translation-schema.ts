import {ColumnType} from '../../types/common'

import { TableSchema } from '../../types/database';

import { schemaRegistry } from '../schema-registry-singleton';

export const translationSchema: TableSchema = {
  name: 'translations',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'key', type: ColumnType.STRING, notNull: true },
    { name: 'value', type: ColumnType.STRING, notNull: true },
    { name: 'language', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true }
  ]
};

schemaRegistry.register(translationSchema);

export default translationSchema;
