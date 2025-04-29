import { TableSchema } from '../types/database';
import { ColumnType } from '../types/common';

import { schemaRegistry } from './schema-registry-singleton';

/**
 * 自动扫描 definitions 目录下所有 *-schema.ts 文件并注册所有表结构
 */
export function registerCoreSchemas(): void {
  console.log('开始注册核心应用模式...');
  
  try {
    // 检查是否已注册以避免重复
    const registeredSchemas = schemaRegistry.getAllSchemas().map((schema: TableSchema) => schema.name);
    console.log('当前已注册的模式:', registeredSchemas.join(', '));
    
    const schemaContext = (require as any).context('./definitions', false, /-schema\.ts$/);
    const schemas: TableSchema[] = schemaContext.keys().map((key: string) => schemaContext(key).default).filter((schema: any) => Boolean(schema));
    
    for (const schema of schemas) {
      if (schema && schema.name && !registeredSchemas.includes(schema.name)) {
        // 用户表增加 bazi 字段（如未定义）
        // 若已通过 user-schema.ts 注册，则此处无需重复定义
        // 可选：如有内联定义或动态注册，也应包含 bazi 字段
        if (schema.name === 'users' && !schema.columns.find((column: any) => column.name === 'bazi')) {
          schema.columns.push({ name: 'bazi', type: ColumnType.STRING, nullable: true });
        }
        
        schemaRegistry.register(schema);
        console.log(`注册表结构: ${schema.name}`);
      }
    }
    
    const allNames = schemaRegistry.getAllSchemas().map((schema: TableSchema) => schema.name);
    console.log('已注册表结构:', allNames.join(', '));
    
    // 验证注册结果
    const finalSchemas = schemaRegistry.getAllSchemas().map((schema: TableSchema) => schema.name);
    console.log('注册后的模式列表:', finalSchemas.join(', '));
    
    // 检查是否有任何模式仍然缺失
    // 修复：用 schema.name 复数名对比，不再用文件名（单数）
    const expectedSchemaNames = schemas.map((schema: TableSchema) => schema.name);
    const stillMissingSchemas = expectedSchemaNames.filter((name: string) => !finalSchemas.includes(name));
    if (stillMissingSchemas.length > 0) {
      console.error(`警告: 以下核心模式注册失败: ${stillMissingSchemas.join(', ')}`);
      console.error('这可能会导致应用程序无法正常工作，请检查模式定义文件');
      // 已移除手动创建最小化的模式逻辑
    } else {
      console.log('✅ 所有核心模式注册成功');
    }
  } catch (error) {
    console.error('注册核心模式时出错:', error);
    throw new Error(`核心模式注册失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}