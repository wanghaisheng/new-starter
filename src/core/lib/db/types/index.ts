import { schemaRegistry } from '../schema';
import { BaseEntity } from './base-entity';

// 明确导入两个不同的BatchOperation接口，避免命名冲突
import { BatchOperation as DBBatchOperation } from './database.types';
import { BatchOperation as SimBatchOperation } from './simulator';

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

// 使用命名空间导出方式，避免命名冲突
import * as DatabaseTypes from './database.types';
import * as SimulatorTypes from './simulator';

// 重新导出命名空间，但排除BatchOperation
export { DatabaseTypes };
export { SimulatorTypes };

// 明确导出重命名后的BatchOperation接口
export type { DBBatchOperation as DatabaseBatchOperation, SimBatchOperation as SimulatorBatchOperation };

// 注意：我们从dating.ts导出User、Match和Message接口，确保整个项目使用统一的类型定义
// 不要在这里重复定义这些接口

// Export schema-based type generator
export const getSchemaType = <T extends BaseEntity>(tableName: string): T => {
  const schema = schemaRegistry.getSchema(tableName);
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return {} as T; // This is just for type inference, actual data comes from the database
};