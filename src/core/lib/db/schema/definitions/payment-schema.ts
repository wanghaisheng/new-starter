import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../schema-registry-singleton';

export const paymentSchema: TableSchema = {
  name: 'payments',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'name', type: ColumnType.STRING, notNull: true },
    { name: 'description', type: ColumnType.STRING, notNull: false },
    { name: 'price', type: ColumnType.NUMBER, notNull: true },
    { name: 'currency', type: ColumnType.STRING, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true }
  ]
};

schemaRegistry.register(paymentSchema);

export default paymentSchema;
