import { schemaRegistry, TableSchema } from '../index';

// 用户表结构定义
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
      type: 'string',
      notNull: true
    },
    {
      name: 'photoUrl',
      type: 'string'
    },
    {
      name: 'bio',
      type: 'text'
    },
    {
      name: 'birthDate',
      type: 'date'
    },
    {
      name: 'interests',
      type: 'json'
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
      name: 'idx_users_name',
      columns: ['name']
    }
  ]
};

// 注册表结构
schemaRegistry.register(userSchema);

export default userSchema;