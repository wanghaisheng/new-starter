import { SchemaRegistry } from './schema-registry';

// 全局唯一 schemaRegistry 实例，供所有 schema 定义和注册调用，彻底避免循环依赖
export const schemaRegistry = SchemaRegistry.getInstance();
