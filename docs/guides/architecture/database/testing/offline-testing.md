# 离线功能测试指南

本指南详细介绍了如何为应用程序编写和运行离线功能测试，确保应用在网络不稳定或离线环境下仍能正常工作。

## 概述

离线功能测试确保应用程序能够：

1. 在没有网络连接的情况下访问缓存的数据
2. 在离线状态下执行操作，并正确存储这些操作
3. 当网络恢复连接时自动同步这些操作
4. 处理同步过程中可能出现的冲突
5. 优雅地处理网络错误

## 测试框架结构

我们的离线测试框架由以下部分组成：

### 1. Jest 配置文件

`jest.offline.config.js` 提供了专门为离线测试定制的Jest配置：

```javascript
// 样例配置
const customJestConfig = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.offline.test.[jt]s?(x)',
    '**/test/**/*.offline.test.[jt]s?(x)',
    '**/offline/**/*.offline.test.[jt]s?(x)'
  ],
  setupFiles: ['<rootDir>/jest.offline.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.offline.after-env.js'],
  // 其他配置...
};
```

### 2. 环境设置文件

`jest.offline.setup.js` 在每个测试文件运行前执行，用于设置全局模拟对象：

- 模拟 localStorage
- 模拟 IndexedDB（使用 fake-indexeddb）
- 模拟网络状态（navigator.onLine）
- 模拟在线/离线事件
- 模拟 Service Worker
- 模拟网络请求限制

### 3. 测试辅助工具

`jest.offline.after-env.js` 提供测试辅助函数和自定义匹配器：

- `toBeOfflineSyncable` 匹配器：检查对象是否可同步
- `toEqualOfflineData` 匹配器：忽略某些字段（如时间戳）进行对象比较
- `mockNetworkStatus` 函数：模拟网络状态切换
- `simulateSyncDelay` 函数：模拟同步延迟

## 编写离线测试

### 测试文件命名

离线测试文件应遵循命名约定 `*.offline.test.tsx`，例如：
- `UserService.offline.test.tsx`
- `MessageSync.offline.test.tsx`

### 基本测试结构

```typescript
import { User } from '@/core/lib/db/models/user';
import { UserService } from '@/core/services/user-service';
import { NetworkService } from '@/core/services/network-service';
import { DatabaseService } from '@/core/lib/db/service';

// 模拟依赖
jest.mock('@/core/services/network-service', () => ({
  NetworkService: {
    isOnline: jest.fn(),
    // 其他方法...
  }
}));

// 模拟数据库服务
jest.mock('@/core/lib/db/service', () => ({
  // 模拟实现
}));

describe('离线功能测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该在离线时访问缓存数据', async () => {
    // 模拟离线状态
    (NetworkService as any).isOnline.mockReturnValue(false);
    
    // 执行测试
    // ...
    
    // 验证结果
    expect(fetchMock).not.toHaveBeenCalled();
    expect(databaseServiceMock.get).toHaveBeenCalled();
  });

  it('应该在连接恢复时同步队列中的操作', async () => {
    // 模拟离线状态
    (NetworkService as any).isOnline.mockReturnValue(false);
    
    // 执行一些离线操作
    // ...
    
    // 模拟恢复连接
    (NetworkService as any).isOnline.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    
    // 等待同步完成
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 验证同步操作
    expect(syncMock).toHaveBeenCalled();
  });
  
  // 其他测试场景...
});
```

### 常见测试场景

1. **缓存数据访问**：
   - 模拟离线状态
   - 验证应用使用本地缓存数据而非网络请求

2. **离线操作队列**：
   - 模拟离线状态
   - 执行操作（如创建、更新、删除）
   - 验证操作被正确添加到同步队列

3. **网络恢复同步**：
   - 模拟离线状态并执行操作
   - 模拟恢复网络连接
   - 验证队列中的操作被同步到远程

4. **冲突处理**：
   - 模拟本地和远程数据存在差异
   - 验证冲突解决策略正确应用

5. **网络错误处理**：
   - 模拟网络请求失败
   - 验证应用优雅地处理错误

## 运行离线测试

### 命令行

使用以下命令运行离线测试：

```bash
# 运行所有离线测试
npm run test:offline

# 监视模式
npm run test:offline:watch

# 生成覆盖率报告
npm run test:offline:coverage

# 使用测试运行脚本
npm run test:all --offline
```

### 调试离线测试

1. 在VSCode中，添加如下配置到`.vscode/launch.json`：

```json
{
  "name": "Debug Offline Tests",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/jest",
  "args": [
    "--config=jest.offline.config.js", 
    "--runInBand", 
    "--no-cache",
    "${relativeFile}"
  ],
  "cwd": "${workspaceRoot}",
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

2. 打开测试文件，放置断点
3. 从调试面板选择"Debug Offline Tests"并运行

## 最佳实践

1. **隔离测试**：每个测试应该独立，避免依赖其他测试的状态

2. **清理资源**：使用`beforeEach`和`afterEach`清理模拟和状态

3. **模拟网络状态**：使用`(NetworkService as any).isOnline.mockReturnValue(false/true)`模拟网络状态

4. **等待异步操作**：使用`await`和`Promise`确保异步操作完成后再断言

5. **模拟时间**：对于依赖计时器的功能，使用Jest的`jest.useFakeTimers()`和`jest.advanceTimersByTime()`

6. **验证离线提示**：测试UI是否正确显示离线状态提示

7. **测试边缘情况**：测试频繁的网络状态切换和部分同步场景

## 示例测试

### 用户服务离线测试

```typescript
// src/test/offline/UserService.offline.test.tsx
import { User } from '@/core/lib/db/models/user';
import { UserService } from '@/core/services/user-service';
import { NetworkService } from '@/core/services/network-service';
import { DatabaseService } from '@/core/lib/db/service';

// 模拟代码...

describe('UserService Offline Tests', () => {
  it('should fetch user from cache when offline', async () => {
    // 模拟离线状态
    (NetworkService as any).isOnline.mockReturnValue(false);
    
    // 测试代码...
    
    // 验证结果
    expect(user).toEqual(mockUser);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  // 其他测试...
});
```

### 消息同步离线测试

```typescript
// src/test/offline/MessageSync.offline.test.tsx
import { MessageService } from '@/core/services/message-service';
// 其他导入...

describe('Message Sync Offline Tests', () => {
  it('should queue message when sent offline', async () => {
    // 模拟离线状态
    (NetworkService as any).isOnline.mockReturnValue(false);
    
    // 发送消息
    await messageService.sendMessage('match-1', 'user-1', 'user-2', 'Hello!');
    
    // 验证消息被添加到同步队列
    expect(syncQueueAddMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'SEND_MESSAGE',
      payload: expect.objectContaining({
        content: 'Hello!'
      })
    }));
  });
  
  // 其他测试...
});
```

## 故障排除

### 常见问题

1. **IndexedDB模拟问题**：
   - 确保`fake-indexeddb`正确设置
   - 检查IndexedDB事务错误

2. **网络事件不触发**：
   - 验证事件监听器是否正确模拟
   - 使用`window.dispatchEvent(new Event('online'))`手动触发

3. **同步未发生**：
   - 确保给予足够时间完成异步操作
   - 检查网络状态变化是否被正确检测

4. **测试超时**：
   - 增加Jest测试超时设置
   - 检查是否有未解决的Promise

### 日志调试

在测试中启用详细日志：

```typescript
beforeAll(() => {
  // 存储原始console.log
  originalConsoleLog = console.log;
  
  // 开启调试日志
  console.log = (...args) => {
    originalConsoleLog('[TEST DEBUG]', ...args);
  };
});

afterAll(() => {
  // 恢复原始console.log
  console.log = originalConsoleLog;
});
```

## 结论

离线功能测试是确保应用程序在各种网络条件下都能可靠工作的关键。通过系统地测试离线场景，我们可以提高应用程序的健壮性和用户体验，尤其是在移动环境中，网络连接通常不稳定或有限。 