import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'
import { EntityStatus } from '../../types/entity-status'

import { schemaRegistry } from '../index';

export const messageSchema: TableSchema = {
  name: 'messages',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'senderId', type: ColumnType.STRING, notNull: true },
    { name: 'receiverId', type: ColumnType.STRING, notNull: true },
    { name: 'content', type: ColumnType.STRING, notNull: true },
    { name: 'type', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: false },
    { name: 'conversationId', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_senderId', columns: ["senderId"], unique: false },
    { name: 'idx_receiverId', columns: ["receiverId"], unique: false },
    { name: 'idx_conversationId', columns: ["conversationId"], unique: false }
  ]
};

schemaRegistry.register(messageSchema);

export default messageSchema;
