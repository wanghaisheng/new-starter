import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';

/**
 * 消息表结构定义
 * 定义消息实体的数据库结构
 */
const messageSchema: TableSchema = {
  name: 'messages',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'matchId',
      type: 'string',
      notNull: true,
      references: {
        table: 'matches',
        column: 'id'
      }
    },
    {
      name: 'senderId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'receiverId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'content',
      type: 'text',
      notNull: true
    },
    {
      name: 'type',
      type: 'string',
      notNull: true,
      defaultValue: 'text'
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'sent'
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_messages_match',
      columns: ['matchId']
    },
    {
      name: 'idx_messages_participants',
      columns: ['senderId', 'receiverId']
    },
    {
      name: 'idx_messages_status',
      columns: ['status']
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