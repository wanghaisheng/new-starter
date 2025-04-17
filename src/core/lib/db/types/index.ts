import { schemaRegistry } from '@/core/lib/db/schema';

import { BaseEntity } from './base-entity';

// 明确导入两个不同的BatchOperation接口，避免命名冲突
import * as DatabaseTypes from './database.types';
import { BatchOperation as SimBatchOperation } from './simulator';

/**
 * 数据库类型定义模块
 * 提供所有数据库相关的类型定义和类型转换工具
 * 
 * @description
 * 这个模块集中导出所有数据库相关的类型定义，包括实体类型、
 * 数据库操作类型和类型转换工具
 */

// 导出基础类型
export * from './base-entity';

// 导出模块化的实体类型
export * from './user';
export * from './location';
export * from './photo';
export * from './match';
export * from './message';
export * from './interaction';
export * from './repository';
export * from './quiz';

// 导出类型转换工具
export * from './converters';

// 命名空间导出，避免命名冲突
export * as DatabaseTypes from './database.types';
export * as SimulatorTypes from './simulator';

// 明确导出重命名后的 BatchOperation 类型
export type { BatchOperation as DatabaseBatchOperation } from './database.types';

/**
 * 获取表结构对应的类型定义
 * 
 * @param tableName 表名
 * @returns 表对应的类型定义（仅用于类型推断）
 * @throws 如果找不到表结构定义
 */
export const getSchemaType = <T extends BaseEntity>(tableName: string): T => {
  const schema = schemaRegistry.getSchema(tableName);
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return {} as T; // 这只是用于类型推断，实际数据来自数据库
};