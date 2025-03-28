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
      name: 'age',
      type: 'integer'
    },
    {
      name: 'bio',
      type: 'text'
    },
    {
      name: 'images',
      type: 'json'
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
      name: 'idx_users_name',
      columns: ['name']
    }
  ]
};

// 注册表结构
schemaRegistry.register(userSchema);

export default userSchema;