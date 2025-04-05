import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';

/**
 * 匹配表结构定义
 * 定义匹配实体的数据库结构
 */
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
      name: 'users',
      type: 'json',
      notNull: true
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'pending'
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
      columns: ['users']
    },
    {
      name: 'idx_matches_status',
      columns: ['status']
    },
    {
      name: 'idx_matches_created_at',
      columns: ['createdAt']
    }
  ]
};

// 注册表结构
schemaRegistry.register(matchSchema);

export default matchSchema;