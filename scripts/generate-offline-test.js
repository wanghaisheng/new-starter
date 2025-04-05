#!/usr/bin/env node

/**
 * 离线功能测试生成脚本
 * 
 * 该脚本用于快速生成离线功能测试文件模板
 * 使用方法: node scripts/generate-offline-test.js ServiceName
 * 
 * 示例: node scripts/generate-offline-test.js MessageService
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const serviceName = process.argv[2];

if (!serviceName) {
  console.error('请提供服务名称参数！');
  console.log('用法: node scripts/generate-offline-test.js ServiceName');
  console.log('例如: node scripts/generate-offline-test.js MessageService');
  process.exit(1);
}

// 确保文件夹存在
const testDir = path.join(process.cwd(), 'src', 'test', 'offline');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`已创建目录: ${testDir}`);
}

const testFileName = `${serviceName}.offline.test.tsx`;
const testFilePath = path.join(testDir, testFileName);

// 检查文件是否已存在
if (fs.existsSync(testFilePath)) {
  console.error(`测试文件已存在: ${testFilePath}`);
  console.log('如需覆盖，请先删除现有文件');
  process.exit(1);
}

// 创建测试文件内容
const testContent = `/**
 * ${serviceName} 离线功能测试
 * 
 * 测试 ${serviceName} 在离线环境下的行为
 */

import { ${serviceName} } from '@/core/services/${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}-service';
import { NetworkService } from '@/core/services/network-service';
import { DatabaseService } from '@/core/lib/db/service';

// 模拟NetworkService
jest.mock('@/core/services/network-service', () => ({
  NetworkService: {
    getInstance: jest.fn(() => ({
      isOnline: jest.fn(),
      addNetworkStatusListener: jest.fn(),
      removeNetworkStatusListener: jest.fn(),
    })),
    isOnline: jest.fn(),
  }
}));

// 模拟DatabaseService
jest.mock('@/core/lib/db/service', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      get: jest.fn(),
      getAll: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      query: jest.fn(),
    })),
  }
}));

// 创建模拟数据
const mockData = {
  // 添加测试所需的模拟数据
};

describe('${serviceName} Offline Tests', () => {
  // 声明测试变量
  let service;
  let networkServiceMock;
  let databaseServiceMock;
  
  // 在每个测试前设置
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置模拟实现
    databaseServiceMock = DatabaseService.getInstance();
    networkServiceMock = NetworkService.getInstance();
    
    // 获取服务实例
    service = ${serviceName}.getInstance();
  });
  
  // 离线数据获取测试
  it('应该在离线时从缓存获取数据', async () => {
    // 模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 模拟数据库返回
    databaseServiceMock.getAll.mockResolvedValue([/* 模拟数据 */]);
    
    // 执行测试的方法
    const result = await service.someMethod();
    
    // 验证结果
    expect(networkServiceMock.isOnline).toHaveBeenCalled();
    expect(databaseServiceMock.getAll).toHaveBeenCalled();
    expect(result).toEqual([/* 预期结果 */]);
  });
  
  // 离线操作队列测试
  it('应该在离线时将操作加入队列', async () => {
    // 模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 可以模拟一个同步队列服务
    // const syncQueueAddMock = jest.fn();
    // require('@/core/lib/db/sync/queue').addToQueue = syncQueueAddMock;
    
    // 执行离线操作方法
    await service.someCreateOrUpdateMethod(/* 参数 */);
    
    // 验证同步队列是否被正确调用
    // expect(syncQueueAddMock).toHaveBeenCalledWith(
    //   expect.objectContaining({
    //     type: 'OPERATION_TYPE',
    //     payload: expect.any(Object)
    //   })
    // );
    
    // 验证数据是否保存到本地数据库
    expect(databaseServiceMock.add).toHaveBeenCalled();
    // 或 expect(databaseServiceMock.update).toHaveBeenCalled();
  });
  
  // 网络恢复同步测试
  it('应该在网络恢复时同步离线操作', async () => {
    // 首先模拟离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    // 执行离线操作
    await service.someMethod(/* 参数 */);
    
    // 然后模拟网络恢复
    networkServiceMock.isOnline.mockReturnValue(true);
    
    // 触发网络恢复事件
    const onlineCallback = networkServiceMock.addNetworkStatusListener.mock.calls[0][0];
    onlineCallback(true);
    
    // 等待同步完成
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 验证同步是否发生
    // 这里需要根据具体的同步机制进行验证
  });
  
  // 冲突处理测试
  it('应该正确处理同步冲突', async () => {
    // 模拟本地和远程数据之间的冲突
    // 实现将根据项目的冲突解决策略而定
  });
  
  // 网络错误处理测试
  it('应该优雅地处理网络错误', async () => {
    // 模拟联网但请求失败的情况
    networkServiceMock.isOnline.mockReturnValue(true);
    
    // 模拟API调用失败
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    // 执行方法
    await service.someMethod();
    
    // 验证错误处理
    // 具体验证将取决于服务的错误处理逻辑
  });
});
`;

// 写入文件
fs.writeFileSync(testFilePath, testContent);

console.log(`✅ 成功创建离线测试文件: ${testFilePath}`);
console.log('');
console.log('下一步:');
console.log('1. 修改测试文件以适配实际的服务实现');
console.log('2. 添加适当的模拟数据和测试用例');
console.log('3. 运行测试: npm run test:offline');
console.log('');
console.log('查看文档了解更多信息: docs/guides/offline-testing-guide.md'); 