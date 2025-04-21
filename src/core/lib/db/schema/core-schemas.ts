import { TableSchema, ColumnType } from './types';

import { schemaRegistry } from './index';

/**
 * 注册核心应用模式
 * 包括用户、匹配和消息等基础数据
 */
export function registerCoreSchemas(): void {
  console.log('开始注册核心应用模式...');
  
  try {
    // 检查是否已注册以避免重复
    const registeredSchemas = schemaRegistry.getAllSchemas().map((schema: TableSchema) => schema.name);
    console.log('当前已注册的模式:', registeredSchemas.join(', '));
    
    const coreSchemas = ['users', 'matches', 'messages'];
    const missingSchemas = coreSchemas.filter(name => !registeredSchemas.includes(name));
    
    if (missingSchemas.length === 0) {
      console.log('所有核心模式已注册，跳过重复注册');
      return;
    }
    
    console.log(`需要注册的核心模式: ${missingSchemas.join(', ')}`);
    
    // 直接导入模式定义
    try {
      // 用户模式
      if (!registeredSchemas.includes('users')) {
        try {
          const userSchema = require('./definitions/user-schema').default;
          if (userSchema) {
            console.log('注册用户模式:', userSchema.name);
            
            // 用户表增加 bazi 字段（如未定义）
            // 若已通过 user-schema.ts 注册，则此处无需重复定义
            // 可选：如有内联定义或动态注册，也应包含 bazi 字段
            if (!userSchema.columns.find(column => column.name === 'bazi')) {
              userSchema.columns.push({ name: 'bazi', type: ColumnType.STRING, nullable: true });
            }
            
            schemaRegistry.register(userSchema);
          } else {
            console.error('用户模式导入失败: 模式为空');
          }
        } catch (error) {
          console.error('用户模式导入失败:', error);
        }
      }
      
      // 匹配模式
      if (!registeredSchemas.includes('matches')) {
        try {
          const matchSchema = require('./definitions/match-schema').default;
          if (matchSchema) {
            console.log('注册匹配模式:', matchSchema.name);
            schemaRegistry.register(matchSchema);
          } else {
            console.error('匹配模式导入失败: 模式为空');
          }
        } catch (error) {
          console.error('匹配模式导入失败:', error);
        }
      }
      
      // 消息模式
      if (!registeredSchemas.includes('messages')) {
        try {
          const messageSchema = require('./definitions/message-schema').default;
          if (messageSchema) {
            console.log('注册消息模式:', messageSchema.name);
            schemaRegistry.register(messageSchema);
          } else {
            console.error('消息模式导入失败: 模式为空');
          }
        } catch (error) {
          console.error('消息模式导入失败:', error);
        }
      }
    } catch (error) {
      console.error('模式导入过程中出错:', error);
    }
    
    // 验证注册结果
    const finalSchemas = schemaRegistry.getAllSchemas().map((schema: TableSchema) => schema.name);
    console.log('注册后的模式列表:', finalSchemas.join(', '));
    
    // 检查是否有任何模式仍然缺失
    const stillMissingSchemas = coreSchemas.filter(name => !finalSchemas.includes(name));
    if (stillMissingSchemas.length > 0) {
      console.error(`警告: 以下核心模式注册失败: ${stillMissingSchemas.join(', ')}`);
      console.error('这可能会导致应用程序无法正常工作，请检查模式定义文件');
      
      // 尝试手动创建最小化的模式
      if (stillMissingSchemas.includes('users')) {
        console.log('尝试创建最小化用户模式作为备用');
        const minimalUserSchema: TableSchema = {
          name: 'users',
          columns: [
            { name: 'id', type: ColumnType.STRING, primaryKey: true },
            { name: 'name', type: ColumnType.STRING, nullable: false },
            { name: 'bazi', type: ColumnType.STRING, nullable: true },
            { name: 'createdAt', type: ColumnType.DATETIME, nullable: false },
            { name: 'updatedAt', type: ColumnType.DATETIME, nullable: false }
          ],
          indexes: [
            { name: 'idx_user_name', columns: ['name'], unique: false }
          ]
        };
        schemaRegistry.register(minimalUserSchema);
      }
      
      if (stillMissingSchemas.includes('matches')) {
        console.log('尝试创建最小化匹配模式作为备用');
        const minimalMatchSchema: TableSchema = {
          name: 'matches',
          columns: [
            { name: 'id', type: ColumnType.STRING, primaryKey: true },
            { name: 'users', type: ColumnType.JSON, nullable: false },
            { name: 'createdAt', type: ColumnType.DATETIME, nullable: false },
            { name: 'updatedAt', type: ColumnType.DATETIME, nullable: false }
          ]
        };
        schemaRegistry.register(minimalMatchSchema);
      }
      
      if (stillMissingSchemas.includes('messages')) {
        console.log('尝试创建最小化消息模式作为备用');
        const minimalMessageSchema: TableSchema = {
          name: 'messages',
          columns: [
            { name: 'id', type: ColumnType.STRING, primaryKey: true },
            { name: 'matchId', type: ColumnType.STRING, nullable: false },
            { name: 'senderId', type: ColumnType.STRING, nullable: false },
            { name: 'content', type: ColumnType.STRING, nullable: false },
            { name: 'createdAt', type: ColumnType.DATETIME, nullable: false }
          ],
          indexes: [
            { name: 'idx_message_match', columns: ['matchId'], unique: false }
          ]
        };
        schemaRegistry.register(minimalMessageSchema);
      }
    } else {
      console.log('✅ 所有核心模式注册成功');
    }
  } catch (error) {
    console.error('注册核心模式时出错:', error);
    throw new Error(`核心模式注册失败: ${error instanceof Error ? error.message : String(error)}`);
  }
} 