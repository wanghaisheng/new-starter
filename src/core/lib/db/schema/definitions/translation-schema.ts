import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

/**
 * 多语言内容表结构定义
 */
const translationSchema: TableSchema = {
  name: 'translations',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'key',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'locale',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'value',
      type: ColumnType.TEXT,
      notNull: true
    },
    {
      name: 'type',
      type: ColumnType.STRING,
      notNull: false
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
      name: 'idx_translations_key_locale',
      columns: ['key', 'locale'],
      unique: true
    }
  ]
};

// 注册表结构
schemaRegistry.register(translationSchema);

export default translationSchema;
