const { MockDataService } = require('../src/core/services/data/mock-data-service');
const { log } = require('../src/core/lib/logger');
const { addDemoUsers } = require('../src/core/lib/db/clients/mock/demo-users');

async function loadDemoData() {
  try {
    log.info('开始加载演示数据...');
    
    // 初始化 MockDataService
    const mockDataService = new MockDataService({
      mockMode: 'memory',
      loadDemoData: true,
      demoDataSource: 'example',
      autoSave: true
    });

    log.info('MockDataService 初始化完成');

    // 初始化服务
    await mockDataService.initialize();
    log.info('MockDataService 初始化成功');

    // 加载演示数据
    await mockDataService.loadDemoData();
    log.info('演示数据加载完成');

    // 添加演示用户
    await addDemoUsers(mockDataService.client);
    log.info('演示用户添加完成');

    // 获取加载后的数据统计
    const users = await mockDataService.getUsers();
    const matches = await mockDataService.getMatches();
    const messages = await mockDataService.getMessages();

    log.info('数据统计', {
      users: users.length,
      matches: matches.length,
      messages: messages.length
    });

    // 验证演示用户是否存在
    const demoUser = await mockDataService.getUserByEmail('demo@example.com');
    if (!demoUser) {
      throw new Error('演示用户创建失败');
    }
    log.info('演示用户验证成功', { userId: demoUser.id });

    return true;
  } catch (error) {
    // 改进错误日志记录
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    };
    
    log.error('加载演示数据失败', { 
      error: errorDetails,
      timestamp: new Date().toISOString()
    });

    // 在控制台输出更详细的错误信息
    console.error('加载演示数据失败:', error);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }

    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  loadDemoData()
    .then(success => {
      if (!success) {
        console.error('演示数据加载失败，请检查日志获取详细信息');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('脚本执行过程中发生未捕获的错误:', error);
      process.exit(1);
    });
}

module.exports = loadDemoData; 