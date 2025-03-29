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
      name: 'user1Id',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'user2Id',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'isMatched',
      type: 'boolean',
      notNull: true,
      defaultValue: false
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
      name: 'idx_matches_users',
      columns: ['user1Id', 'user2Id'],
      unique: true
    },
    {
      name: 'idx_matches_status',
      columns: ['isMatched']
    }
  ]
};

// 注册表结构
schemaRegistry.register(matchSchema);

export default matchSchema;