import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

/**
 * 匹配表结构定义
 * 定义匹配实体的数据库结构
 */
const matchSchema: TableSchema = {
  name: 'matches',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'users',
      type: ColumnType.JSON,
      notNull: true
    },
    {
      name: 'status',
      type: ColumnType.STRING,
      notNull: true,
      defValue: 'pending'
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