import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { SchemaRegistry as schemaRegistry } from '../schema-registry';

export const locationSchema: TableSchema = {
  name: 'locations',
  columns: [
    { name: 'latitude', type: ColumnType.NUMBER, notNull: true },
    { name: 'longitude', type: ColumnType.NUMBER, notNull: true },
    { name: 'accuracy', type: ColumnType.NUMBER, notNull: false },
    { name: 'timestamp', type: ColumnType.NUMBER, notNull: false },
    { name: 'address', type: ColumnType.STRING, notNull: false }
  ],
  indexes: [

  ]
};

schemaRegistry.register(locationSchema);

export default locationSchema;
