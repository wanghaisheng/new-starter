import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../index';

export const giftSchema: TableSchema = {
  name: 'gifts',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'name', type: ColumnType.STRING, notNull: true },
    { name: 'iconUrl', type: ColumnType.STRING, notNull: true },
    { name: 'value', type: ColumnType.NUMBER, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true }
  ]
};

schemaRegistry.register(giftSchema);

export default giftSchema;
