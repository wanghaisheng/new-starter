import { ISchemaRegistry, TableSchema } from '../types/database';

export default class SchemaRegistry implements ISchemaRegistry {
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
    // 如果已存在同名 schema，则不覆盖，直接返回
    if (this.schemas.has(schema.name)) return;
    this.schemas.set(schema.name, schema);
  }

  /**
   * 获取表结构
   */
  public getSchema(name: string): TableSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * 获取所有表结构，可按端类型过滤
   * @param target 可选，'offline' | 'online' | 'hybrid'，未指定时默认为 'online'
   */
  public getAllSchemas(target?: 'offline' | 'online' | 'hybrid'): TableSchema[] {
    const actualTarget = target || 'online';
    // 返回深拷贝，避免外部修改影响内部
    return Array.from(this.schemas.values()).map(schema => {
      // 字段过滤
      const columns = (schema.columns || []).filter(col => !col.onlyFor || col.onlyFor === actualTarget || (actualTarget === 'hybrid' && !col.onlyFor));
      // 索引过滤
      const indexes = (schema.indexes || []).filter(idx => !idx.onlyFor || idx.onlyFor === actualTarget || (actualTarget === 'hybrid' && !idx.onlyFor));
      // 深拷贝 columns 和 indexes
      return {
        ...schema,
        columns: JSON.parse(JSON.stringify(columns)),
        indexes: JSON.parse(JSON.stringify(indexes)),
      };
    });
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