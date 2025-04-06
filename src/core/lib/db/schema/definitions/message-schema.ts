import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

/**
 * 消息表结构定义
 * 定义消息实体的数据库结构
 */
const messageSchema: TableSchema = {
  name: 'messages',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'matchId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'matches',
        column: 'id'
      }
    },
    {
      name: 'senderId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'receiverId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'content',
      type: ColumnType.TEXT,
      notNull: true
    },
    {
      name: 'type',
      type: ColumnType.STRING,
      notNull: true,
      defValue: 'text'
    },
    {
      name: 'status',
      type: ColumnType.STRING,
      notNull: true,
      defValue: 'sent'
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_messages_match',
      columns: ['matchId']
    },
    {
      name: 'idx_messages_sender',
      columns: ['senderId']
    },
    {
      name: 'idx_messages_receiver',
      columns: ['receiverId']
    },
    {
      name: 'idx_messages_created_at',
      columns: ['createdAt']
    }
  ]
};

// 注册表结构
schemaRegistry.register(messageSchema);

export default messageSchema;