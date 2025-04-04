/**
 * Jest离线测试环境扩展
 * 
 * 这个文件在每个测试文件执行后加载，用于扩展Jest环境
 */

// 导入测试辅助工具
import '@testing-library/jest-dom';

// 配置Jest匹配器
expect.extend({
  // 自定义匹配器：检查对象是否包含特定属性
  toBeOfflineSyncable(received, expected) {
    const hasType = typeof received.type === 'string';
    const hasPayload = received.payload !== undefined;
    const hasTimestamp = typeof received.timestamp === 'number';
    
    const pass = hasType && hasPayload && hasTimestamp;
    
    if (pass) {
      return {
        message: () => `期望 ${this.utils.printReceived(received)} 不是一个可同步的对象`,
        pass: true,
      };
    } else {
      return {
        message: () => `期望 ${this.utils.printReceived(received)} 是一个可同步的对象`,
        pass: false,
      };
    }
  },
  
  // 自定义匹配器：检查对象是否与预期的离线数据一致
  toEqualOfflineData(received, expected) {
    // 忽略时间戳和其他可能不同的字段
    const receivedCopy = { ...received };
    const expectedCopy = { ...expected };
    
    delete receivedCopy.updatedAt;
    delete expectedCopy.updatedAt;
    delete receivedCopy.syncStatus;
    delete expectedCopy.syncStatus;
    
    const pass = this.equals(receivedCopy, expectedCopy);
    
    if (pass) {
      return {
        message: () => `期望 ${this.utils.printReceived(received)} 与离线数据不匹配`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `期望 ${this.utils.printReceived(received)} 与离线数据匹配:\n` +
          `${this.utils.printExpected(expected)}`,
        pass: false,
      };
    }
  },
});

// 全局测试辅助函数

// 模拟网络状态切换
global.mockNetworkStatus = (online) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: online,
  });
  
  // 触发相应事件
  if (online) {
    window.dispatchEvent(new Event('online'));
  } else {
    window.dispatchEvent(new Event('offline'));
  }
};

// 模拟数据同步延迟
global.simulateSyncDelay = async (ms = 100) => {
  jest.advanceTimersByTime(ms);
  await new Promise(resolve => setTimeout(resolve, 10)); // 允许异步操作完成
};

// 在每个测试前重置网络状态
beforeEach(() => {
  // 默认为在线状态
  global.mockNetworkStatus(true);
});

// 在每个测试后恢复网络状态
afterEach(() => {
  global.mockNetworkStatus(true);
  jest.clearAllMocks();
}); 