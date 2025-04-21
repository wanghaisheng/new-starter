import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

/**
 * 用户表结构定义
 * 定义用户实体的数据库结构
 */
const userSchema: TableSchema = {
  name: 'users',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'name',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'email',
      type: ColumnType.STRING
    },
    {
      name: 'phone',
      type: ColumnType.STRING
    },
    {
      name: 'googleId',
      type: ColumnType.STRING
    },
    {
      name: 'bio',
      type: ColumnType.TEXT
    },
    {
      name: 'birthDate',
      type: ColumnType.DATE,
      notNull: true
    },
    {
      name: 'gender',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'photos',
      type: ColumnType.JSON,
      notNull: true,
      defValue: '[]'
    },
    {
      name: 'interests',
      type: ColumnType.JSON,
      notNull: true,
      defValue: '[]'
    },
    {
      name: 'location',
      type: ColumnType.JSON,
      notNull: true
    },
    {
      name: 'preferences',
      type: ColumnType.JSON,
      notNull: true
    },
    {
      name: 'tags',
      type: ColumnType.JSON,
      notNull: true,
      defValue: '[]'
    },
    {
      name: 'profile',
      type: ColumnType.JSON,
      notNull: true,
      defValue: '{}'
    },
    {
      name: 'isVerified',
      type: ColumnType.BOOLEAN,
      notNull: true,
      defValue: false
    },
    {
      name: 'lastActive',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'status',
      type: ColumnType.STRING,
      notNull: true,
      defValue: 'active'
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
    },
    {
      name: 'bazi',
      type: ColumnType.JSON,
      notNull: false,
      defValue: '{}'
    }
  ],
  indexes: [
    {
      name: 'idx_users_email',
      columns: ['email'],
      unique: true
    },
    {
      name: 'idx_users_phone',
      columns: ['phone'],
      unique: true
    },
    {
      name: 'idx_users_google_id',
      columns: ['googleId'],
      unique: true
    },
    {
      name: 'idx_users_name',
      columns: ['name']
    },
    {
      name: 'idx_users_status',
      columns: ['status']
    },
    {
      name: 'idx_users_last_active',
      columns: ['lastActive']
    }
  ]
};

// 注册表结构
schemaRegistry.register(userSchema);

export default userSchema;