import { schemaRegistry, TableSchema } from '../index';

// 消息表结构定义
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
      name: 'content',
      type: 'text',
      notNull: true
    },
    {
      name: 'sentAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'readAt',
      type: 'date'
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
      name: 'idx_messages_sender',
      columns: ['senderId']
    },
    {
      name: 'idx_messages_sent_at',
      columns: ['sentAt']
    }
  ]
};

// 注册表结构
schemaRegistry.register(messageSchema);

export default messageSchema;