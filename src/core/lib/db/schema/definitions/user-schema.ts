import { schemaRegistry, TableSchema } from '../index';

/**
 * 用户表结构定义
 * 定义用户实体的数据库结构
 */
const userSchema: TableSchema = {
  name: 'users',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'name',
      type: 'string',
      notNull: true
    },
    {
      name: 'email',
      type: 'string'
    },
    {
      name: 'phone',
      type: 'string'
    },
    {
      name: 'googleId',
      type: 'string'
    },
    {
      name: 'bio',
      type: 'text'
    },
    {
      name: 'birthDate',
      type: 'date',
      notNull: true
    },
    {
      name: 'gender',
      type: 'string',
      notNull: true
    },
    {
      name: 'photos',
      type: 'json',
      notNull: true,
      defaultValue: '[]'
    },
    {
      name: 'interests',
      type: 'json',
      notNull: true,
      defaultValue: '[]'
    },
    {
      name: 'location',
      type: 'json',
      notNull: true
    },
    {
      name: 'preferences',
      type: 'json',
      notNull: true
    },
    {
      name: 'isVerified',
      type: 'boolean',
      notNull: true,
      defaultValue: false
    },
    {
      name: 'lastActive',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'active'
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