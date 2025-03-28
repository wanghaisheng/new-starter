import { schemaRegistry, TableSchema } from '../index';

// 匹配表结构定义
const matchSchema: TableSchema = {
  name: 'matches',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'userId1',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'userId2',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'pending'
    },
    {
      name: 'matchedAt',
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
      name: 'idx_matches_user1',
      columns: ['userId1']
    },
    {
      name: 'idx_matches_user2',
      columns: ['userId2']
    },
    {
      name: 'idx_matches_status',
      columns: ['status']
    }
  ]
};

// 注册表结构
schemaRegistry.register(matchSchema);

export default matchSchema;