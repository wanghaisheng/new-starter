import { ISchemaRegistry, TableSchema } from './types';

export class SchemaRegistry implements ISchemaRegistry {
  private static instance: SchemaRegistry;
  private schemas: Map<string, TableSchema>;

  private constructor() {
    this.schemas = new Map();
  }

  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  /**
   * 注册表结构
   */
  public register(schema: TableSchema): void {
    this.schemas.set(schema.name, schema);
  }

  /**
   * 获取表结构
   */
  public getSchema(name: string): TableSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * 获取所有表结构
   */
  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * 检查表是否存在
   */
  public hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * 删除表结构
   */
  public removeSchema(name: string): void {
    this.schemas.delete(name);
  }

  /**
   * 清空所有表结构
   */
  public clear(): void {
    this.schemas.clear();
  }
} 