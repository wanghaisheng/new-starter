/**
 * 验证数据库模式注册
 * 
 * 用于检查数据库模式是否正确注册
 * 用法: node tools/verify-schema.js
 */

// 模拟浏览器环境
if (typeof window === 'undefined') {
  global.window = {};
  global.document = { createElement: () => ({}) };
  global.navigator = { userAgent: 'node' };
}

// 手动设置环境变量
process.env.NEXT_PUBLIC_DATABASE_ENV = 'mock';
process.env.NEXT_PUBLIC_MOCK_DB_TYPE = 'mock';
process.env.NEXT_PUBLIC_DB_NAME = 'app_database_mock';
process.env.NEXT_PUBLIC_DB_VERSION = '1';
process.env.NEXT_PUBLIC_USE_FAKE_INDEXEDDB = 'true';
process.env.NEXT_PUBLIC_DB_SYNC_ENABLED = 'false';

async function main() {
  try {
    console.log('====== 数据库模式注册验证 ======');
    
    // 导入模式注册表
    const { schemaRegistry } = require('../src/core/lib/db/schema');
    console.log('初始模式数量:', schemaRegistry.getAllSchemas().length);
    
    // 导入模式定义
    console.log('\n正在检查用户模式...');
    try {
      const userSchema = require('../src/core/lib/db/schema/definitions/user-schema');
      console.log('✅ 用户模式导入成功');
    } catch (error) {
      console.error('❌ 用户模式导入失败:', error.message);
    }
    
    console.log('\n正在检查匹配模式...');
    try {
      const matchSchema = require('../src/core/lib/db/schema/definitions/match-schema');
      console.log('✅ 匹配模式导入成功');
    } catch (error) {
      console.error('❌ 匹配模式导入失败:', error.message);
    }
    
    console.log('\n正在检查消息模式...');
    try {
      const messageSchema = require('../src/core/lib/db/schema/definitions/message-schema');
      console.log('✅ 消息模式导入成功');
    } catch (error) {
      console.error('❌ 消息模式导入失败:', error.message);
    }
    
    // 初始化所有模式
    console.log('\n正在执行模式初始化...');
    const { initializeSchemas } = require('../src/core/lib/db/schema');
    initializeSchemas();
    
    // 获取最终注册的模式
    const schemas = schemaRegistry.getAllSchemas();
    console.log('\n最终注册的模式:', schemas.map(s => s.name).join(', '));
    console.log('总模式数量:', schemas.length);
    
    // 检查核心模式是否已注册
    const coreSchemas = ['users', 'matches', 'messages'];
    const missingSchemas = coreSchemas.filter(name => !schemas.some(s => s.name === name));
    
    if (missingSchemas.length > 0) {
      console.error(`\n❌ 缺少以下核心模式: ${missingSchemas.join(', ')}`);
    } else {
      console.log('\n✅ 所有核心模式已成功注册');
    }
    
    // 详细打印每个模式
    console.log('\n模式详情:');
    schemas.forEach((schema, index) => {
      console.log(`${index + 1}. ${schema.name} - 列数: ${schema.columns?.length || 0}`);
    });
    
    console.log('\n====== 验证完成 ======');
  } catch (error) {
    console.error('验证过程中出错:', error);
  }
}

main().catch(console.error); 