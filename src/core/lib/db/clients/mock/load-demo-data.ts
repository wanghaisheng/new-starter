import { MockDataService } from '@/core/services/data/mock-data-service';
import { Logger } from '@/core/lib/utils/logger';

/**
 * 加载演示数据到Mock数据库
 * 
 * 使用方法:
 * 1. 在开发环境中运行: bun run --bun src/core/lib/db/clients/mock/load-demo-data.ts
 * 2. 在代码中调用: import { loadDemoData } from '@/core/lib/db/clients/mock/load-demo-data';
 *    await loadDemoData();
 */
export async function loadDemoData(dataSource: 'example' | 'dating' = 'example'): Promise<void> {
  const logger = new Logger('LoadDemoData');
  
  try {
    logger.info(`开始加载${dataSource}演示数据...`);
    
    // 创建MockDataService实例
    const mockDataService = MockDataService.getInstance({
      mockMode: 'memory',
      loadDemoData: true,
      demoDataSource: dataSource
    });
    
    // 初始化服务
    await mockDataService.initialize();
    
    // 加载演示数据
    await mockDataService.loadDemoData();
    
    logger.info(`✅ ${dataSource}演示数据加载完成`);
    
    // 打印加载的数据统计
    const users = await mockDataService.getUsers();
    const matches = await mockDataService.getMatches();
    const messages = await mockDataService.getMessages();
    
    logger.info(`数据统计:
    - 用户: ${users.length}个
    - 匹配: ${matches.length}个
    - 消息: ${messages.length}个
    `);
    
  } catch (error) {
    logger.error(`加载${dataSource}演示数据失败`, { error });
    throw error;
  }
}

// 如果直接运行此脚本，则执行加载
if (require.main === module) {
  const dataSource = process.argv[2] as 'example' | 'dating' || 'example';
  loadDemoData(dataSource)
    .then(() => {
      console.log('演示数据加载完成，可以退出程序');
      process.exit(0);
    })
    .catch((error) => {
      console.error('加载演示数据失败:', error);
      process.exit(1);
    });
} 