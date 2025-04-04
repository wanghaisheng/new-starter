# 离线功能测试指南

本文档提供了如何测试应用离线功能的指南，确保应用在网络连接不稳定或断开的情况下能够正常工作。

## 测试目标

离线功能测试的主要目标是验证以下场景：

1. 用户在离线状态下访问已缓存的数据
2. 离线操作后恢复网络连接时数据正确同步
3. 网络状态变化时应用有适当的用户提示
4. 离线存储机制正常工作

## 测试环境配置

### 模拟离线状态

**Chrome DevTools**:
1. 打开Chrome开发者工具(F12)
2. 切换到"Network"标签
3. 勾选"Offline"选项或使用下拉菜单选择其他网络条件（如"Slow 3G"）

**应用内置网络模拟**:
```typescript
// 使用NetworkService模拟离线状态
import { NetworkService } from '@/core/services/network-service';

// 模拟离线
NetworkService.simulateOffline(true);

// 恢复在线
NetworkService.simulateOffline(false);
```

## 测试场景

### 1. 基本离线数据访问

**步骤**:
1. 使应用正常加载并确保数据已缓存
2. 启用离线模式
3. 导航到各个主要页面
4. 验证页面能正确显示之前加载的数据

**期望结果**:
- 所有已缓存的页面和数据应该正常显示
- 应用应该显示离线状态指示器
- 不应有阻止用户浏览已加载内容的错误

### 2. 离线操作与同步

**步骤**:
1. 启用离线模式
2. 执行数据修改操作（如喜欢/不喜欢用户、发送消息）
3. 验证操作在UI上反映出来
4. 恢复网络连接
5. 验证离线操作数据被同步到服务器

**期望结果**:
- 离线操作应立即反映在UI上
- 应有"待同步"或类似的状态指示
- 恢复连接后，数据应自动同步
- 同步完成后应有成功提示

### 3. 网络状态变化处理

**步骤**:
1. 在应用正常运行时启用离线模式
2. 观察应用的反应
3. 恢复网络连接
4. 观察应用的反应

**期望结果**:
- 切换到离线模式时应显示通知
- 离线期间应限制需要网络的功能
- 恢复连接时应显示通知
- 恢复连接后应自动恢复所有功能

### 4. 存储限制测试

**步骤**:
1. 填充大量数据到IndexedDB（可通过脚本实现）
2. 检查存储使用情况
3. 验证应用的降级策略是否正确实施

**期望结果**:
- 应用应能处理存储配额限制
- 应优先保留关键数据
- 当达到存储限制时应有适当的用户通知

## 数据验证

### IndexedDB检查

**Chrome DevTools**:
1. 打开Chrome开发者工具(F12)
2. 切换到"Application"标签
3. 展开"IndexedDB"部分
4. 选择应用的数据库
5. 检查存储的数据

**脚本检查**:
```javascript
// 在控制台执行检查IndexedDB内容
(async () => {
  const db = await indexedDB.open('app_database_local', 1);
  db.onsuccess = () => {
    const transaction = db.result.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();
    request.onsuccess = () => {
      console.log('Stored users:', request.result);
    };
  };
})();
```

### 同步状态检查

```javascript
// 在控制台查看待同步队列
console.log(window.APP_SYNC_QUEUE);
```

## 常见问题

### 数据不同步

如果离线操作后数据没有同步到服务器，检查：
- 网络状态检测是否正常工作
- 同步队列是否正确记录操作
- IndexedDB事务是否成功完成
- 网络恢复监听器是否正确设置

### 离线指示器不准确

如果应用无法正确检测网络状态：
- 检查`navigator.onLine`属性是否被正确监听
- 验证网络事件监听器(`online`和`offline`)是否正确注册
- 检查网络请求超时设置是否合理

### 存储配额限制

如果遇到存储空间问题：
- 检查浏览器的存储配额（一般Chrome为大约5MB）
- 实现数据压缩策略
- 优化缓存策略，只存储必要数据
- 实现LRU(最近最少使用)缓存策略

## 自动化测试

可以使用以下工具进行自动化离线功能测试：

```typescript
// 示例：自动化离线功能测试
describe('Offline Functionality', () => {
  beforeEach(() => {
    // 确保应用在在线状态下加载
    NetworkService.simulateOffline(false);
    // 加载应用和数据
  });
  
  it('should display cached data when offline', async () => {
    // 模拟离线
    NetworkService.simulateOffline(true);
    
    // 验证数据显示
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Sarah')).toBeInTheDocument();
  });
  
  it('should sync data when coming back online', async () => {
    // 模拟离线
    NetworkService.simulateOffline(true);
    
    // 执行离线操作
    fireEvent.click(screen.getByText('Like'));
    
    // 验证UI更新
    expect(screen.getByText('Like (Pending)')).toBeInTheDocument();
    
    // 恢复在线
    NetworkService.simulateOffline(false);
    
    // 等待同步完成
    await waitFor(() => {
      expect(screen.getByText('Like')).toBeInTheDocument();
      expect(screen.queryByText('Like (Pending)')).not.toBeInTheDocument();
    });
  });
});
```

## 结论

彻底的离线功能测试对于确保应用在各种网络条件下的可靠性至关重要。通过上述测试场景和工具，可以验证应用的离线功能是否符合预期，并在发现问题时及时修复。

记住，良好的离线体验是提升用户满意度的关键因素，特别是对于移动应用而言。 