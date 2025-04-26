import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

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
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'conversationId', type: ColumnType.STRING, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: true }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_senderId', columns: ["senderId"], unique: true },
    { name: 'idx_receiverId', columns: ["receiverId"], unique: true },
    { name: 'idx_conversationId', columns: ["conversationId"], unique: true }
  ]
};

schemaRegistry.register(messageSchema);

export default messageSchema;
