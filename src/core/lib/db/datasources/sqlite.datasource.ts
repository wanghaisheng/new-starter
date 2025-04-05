/**
 * SQLite 数据源配置
 * 
 * 此文件配置 TypeORM 的 SQLite 数据源，用于与 Capacitor SQLite 插件集成。
 * 它将我们自己的架构注册表转换为 TypeORM 所需的表定义格式。
 */
import { DataSource } from 'typeorm';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

import { SQLITE_CONFIG } from '@/core/lib/db/clients/capacitor-sqlite/sqlite-config';
import { schemaRegistry } from '@/core/lib/db/schema';
import { getAppPlatform } from '@/core/lib/platform';
import { TableSchema, ColumnDefinition, IndexDefinition } from '@/core/lib/db/schema/types';
import { ColumnType } from '@/core/lib/db/schema/types';

// 定义SQLite表定义接口
interface SQLiteColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  defaultValue?: any;
}

interface SQLiteIndex {
  name: string;
  columnNames: string[];
  isUnique: boolean;
}

interface SQLiteTable {
  name: string;
  columns: SQLiteColumn[];
  indexes: SQLiteIndex[];
}

// 转换架构注册表为 SQLite 表定义
const getTableDefinitions = (): SQLiteTable[] => {
  const schemas = schemaRegistry.getAllSchemas();
  return schemas.map((schema: TableSchema) => ({
    name: schema.name,
    columns: schema.columns.map((col: ColumnDefinition) => ({
      name: col.name,
      type: mapColumnType(col.type),
      primaryKey: col.primaryKey || false,
      notNull: !(col.nullable || false),
      defaultValue: col.defaultValue
    })),
    indexes: (schema.indexes || []).map((index: IndexDefinition) => ({
      name: index.name || `idx_${schema.name}_${index.columns.join('_')}`,
      columnNames: index.columns,
      isUnique: !!index.unique
    }))
  }));
};

// 映射我们的架构类型到 SQLite 类型
const mapColumnType = (type: string | ColumnType): string => {
  // 将type转为小写字符串以便比较
  const typeStr = typeof type === 'string' ? type.toLowerCase() : String(type).toLowerCase();
  
  switch (typeStr) {
    case 'string':
    case 'text':
      return 'TEXT';
    case 'number':
    case 'integer':
    case 'int':
      return 'INTEGER';
    case 'boolean':
    case 'bool':
      return 'INTEGER'; // SQLite 使用 INTEGER 存储布尔值 (0 或 1)
    case 'date':
    case 'datetime':
      return 'TEXT'; // SQLite 中日期存储为 ISO 字符串
    case 'json':
    case 'object':
    case 'array':
      return 'TEXT'; // JSON 数据存储为文本
    case 'blob':
      return 'BLOB';
    default:
      console.warn(`未知的列类型 "${type}"，默认使用 TEXT`);
      return 'TEXT'; // 默认为 TEXT
  }
};

// 准备 Capacitor 驱动程序参数
const getCapacitorOptions = () => {
  const platform = getAppPlatform();
  const options: any = {
    type: 'capacitor',
    database: SQLITE_CONFIG.database.name,
    version: SQLITE_CONFIG.database.version,
    synchronize: true, // 仅在开发环境使用，生产环境应使用迁移
    logging: SQLITE_CONFIG.debug?.enableLogging || false,
  };
  
  // 在 Web 平台使用 jeep-sqlite 模式
  if (platform === 'web') {
    options.mode = 'no-encryption';
    options.driver = CapacitorSQLite;
  } 
  // 在移动平台使用本地驱动
  else {
    options.mode = SQLITE_CONFIG.encryption?.enabled ? 'encryption' : 'no-encryption';
    options.driver = CapacitorSQLite;
    
    // 如果启用了加密，添加密钥
    if (SQLITE_CONFIG.encryption?.enabled && SQLITE_CONFIG.encryption?.key) {
      options.key = SQLITE_CONFIG.encryption.key;
    }
  }
  
  // 添加数据表定义
  options.tables = getTableDefinitions();
  
  return options;
};

// 创建 SQLite 数据源实例
export const sqliteDataSource = new DataSource(getCapacitorOptions());

/**
 * 初始化 SQLite 数据源
 * 
 * 此函数初始化 TypeORM 数据源，如果多次调用，它将确保只初始化一次。
 * 
 * @returns 初始化的数据源
 * @throws 如果初始化失败则抛出错误
 */
export const initializeSqliteDataSource = async (): Promise<DataSource> => {
  try {
    // 避免重复初始化
    if (!sqliteDataSource.isInitialized) {
      console.log('正在初始化 SQLite 数据源...');
      await sqliteDataSource.initialize();
      console.log('SQLite 数据源已成功初始化');
    } else {
      console.log('SQLite 数据源已经初始化');
    }
    return sqliteDataSource;
  } catch (error) {
    console.error('SQLite 数据源初始化过程中出错:', error);
    // 记录错误详情以便调试
    if (error instanceof Error) {
      console.error(`错误名称: ${error.name}`);
      console.error(`错误消息: ${error.message}`);
      console.error(`错误堆栈: ${error.stack}`);
    }
    
    // 重新抛出错误以便上层处理
    throw new Error(`无法初始化 SQLite 数据源: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 