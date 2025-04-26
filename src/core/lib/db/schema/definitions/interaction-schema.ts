import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../index';

export const interactionSchema: TableSchema = {
  name: 'interactions',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'reporterId', type: ColumnType.STRING, notNull: true },
    { name: 'targetUserId', type: ColumnType.STRING, notNull: true },
    { name: 'reason', type: ColumnType.STRING, notNull: true },
    { name: 'details', type: ColumnType.STRING, notNull: false },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'resolution', type: ColumnType.JSON, notNull: false },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_reporterId', columns: ["reporterId"], unique: true },
    { name: 'idx_targetUserId', columns: ["targetUserId"], unique: true }
  ]
};

schemaRegistry.register(interactionSchema);

export default interactionSchema;
