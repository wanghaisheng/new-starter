import { schemaRegistry } from '../schema-registry-singleton';
import { ColumnType, TableSchema } from '../types';

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
      type: ColumnType.JSON
    },
    {
      name: 'status',
      type: ColumnType.STRING,
      notNull: true,
      defValue: 'active'
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
      notNull: false
    }
    // ... 其它字段
  ]
};

// 注册表结构
schemaRegistry.register(userSchema);

export default userSchema;