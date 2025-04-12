# 混合数据库客户端使用指南

本文档详细介绍了如何配置和使用混合数据库客户端（HybridDatabaseClient），这是一个支持同时使用本地和远程数据存储的高级解决方案，提供无缝的在线/离线数据访问和自动同步功能。

## 概述

混合数据库客户端通过同时管理本地存储和远程存储，提供了以下关键优势：

- **离线优先工作模式**：即使在无网络环境下，应用仍能完整运行
- **数据同步**：网络恢复后自动同步本地更改到远程服务器
- **冲突解决策略**：支持多种冲突解决方案
- **性能优化**：本地操作优先，减少网络延迟

## 配置方法

### 方法一：通过环境变量启用

在项目的环境配置文件（`.env.local`、`.env.development`等）中添加：

```
NEXT_PUBLIC_DATABASE_ENV=local  # 或 production
NEXT_PUBLIC_USE_HYBRID_CLIENT=true
```

### 方法二：通过代码启用

```typescript
import { DataServiceFactory } from '@/core/services/data-service-factory';

// 在应用初始化阶段
DataServiceFactory.setUseHybridClient(true);

// 然后获取数据服务实例
const dataService = DataServiceFactory.getDataService();
await dataService.initialize();
```

### 高级配置选项

混合数据库客户端支持更多高级配置选项，可以通过修改`src/core/services/database-service.ts`中的环境配置来自定义：

```typescript
// 在getEnvironmentConfig方法中
return {
  ...baseConfig,
  syncIntervalMs: 30000, // 同步间隔时间
  enableDebugLogs: true,
  dbClientType: useHybrid ? 
    DatabaseClientType.HYBRID :
    (dbEnv === 'local' ? 
      DatabaseClientType.INDEXEDDB : 
      DatabaseClientType.MOCK_INDEXEDDB),
  hybridConfig: {
    syncStrategy: 'immediate', // 同步策略：'immediate'、'periodic'、'manual'
    conflictResolution: 'last-write-wins' // 冲突解决策略：'last-write-wins'、'client-wins'、'server-wins'
  }
};
```

## 使用示例

### 基本数据操作

使用混合客户端进行数据操作与使用普通数据服务相同，但底层行为不同：

```typescript
import { DataServiceFactory } from '@/core/services/data-service-factory';

// 获取数据服务
const dataService = DataServiceFactory.getDataService();

// 创建用户 - 先保存到本地，之后自动同步到远程
const user = await dataService.createUser({
  name: '张三',
  email: 'zhangsan@example.com',
  // 其他属性
});

// 查询用户 - 优先查询本地库
const foundUser = await dataService.getUser(user.id);

// 更新用户 - 先更新本地，然后根据同步策略同步到远程
await dataService.updateUser(user.id, { 
  name: '张三 (已更新)'
});

// 删除用户
await dataService.deleteUser(user.id);
```

### 强制同步操作

有时候需要立即同步数据，可以使用：

```typescript
// 强制执行同步
await dataService.forceSync();
```

### 离线状态处理

应用中可以监听网络状态变化，并相应调整UI：

```typescript
import { NetworkService } from '@/core/services/network-service';

const networkService = NetworkService.getInstance();

// 监听网络状态变化
networkService.onNetworkStatusChange((isOnline) => {
  if (isOnline) {
    console.log('网络已连接，数据将自动同步');
    showOnlineIndicator();
  } else {
    console.log('网络已断开，应用将以离线模式运行');
    showOfflineIndicator();
  }
});
```

## 同步策略说明

混合客户端支持三种同步策略：

1. **即时同步 (immediate)**：每次数据变更后立即尝试同步，适合重要数据
2. **定期同步 (periodic)**：按配置的时间间隔定期同步，平衡电量消耗和数据及时性
3. **手动同步 (manual)**：仅在用户明确请求或调用API时同步，适合非关键数据或大量数据

## 冲突解决策略

当本地和远程数据发生冲突时，系统会根据配置的策略自动解决：

- **client-wins**：本地数据覆盖远程数据，适合用户个人设置等场景
- **server-wins**：远程数据覆盖本地数据，适合共享资源类场景
- **last-write-wins**：以最后修改时间为准，适合大多数一般场景

## 最佳实践

1. **合理选择同步策略**：
   - 对关键业务数据使用`immediate`同步策略
   - 对次要数据使用`periodic`或`manual`策略节省资源

2. **冲突解决策略选择**：
   - 对个人配置等私有数据使用`client-wins`
   - 对共享资源使用`server-wins`或`last-write-wins`

3. **离线体验优化**：
   - 设计UI以显示当前同步状态
   - 为用户提供手动触发同步的选项
   - 离线模式下禁用依赖实时网络的功能，但保留核心功能

4. **性能优化**：
   - 批量同步大量数据以减少同步次数
   - 为非关键数据设置更长的同步间隔
   - 在网络条件较好时执行大型同步操作

## 调试技巧

1. **启用调试日志**：
   ```typescript
   // 在环境配置中
   enableDebugLogs: true
   ```

2. **监控同步状态**：
   ```typescript
   // 获取当前同步状态
   const syncStatus = await dataService.getSyncStatus();
   console.log('同步状态:', syncStatus);
   ```

3. **测试离线行为**：
   - 使用浏览器开发工具中的网络条件模拟器切断网络
   - 使用 `NetworkService.simulateOffline()` 方法模拟网络中断

## 常见问题解答

**Q: 如何确保关键操作即使在离线状态下也能保存?**  
A: 混合客户端默认使用离线优先策略，所有操作首先保存到本地存储，即使没有网络连接。

**Q: 同步过程中发生错误怎么办?**  
A: 系统会自动重试失败的同步操作，直到达到配置的重试次数。错误会被记录到日志中，同时可以通过监听错误事件来处理。

**Q: 手机上的存储空间有限，如何管理离线数据大小?**  
A: 可以通过配置混合客户端的离线存储设置来限制本地存储使用的最大空间：
```typescript
hybridConfig: {
  offline: {
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    maxEntitiesPerTable: 10000,
    compressionEnabled: true
  }
}
```

**Q: 混合客户端会自动处理网络恢复后的同步吗?**  
A: 是的，当网络恢复连接后，系统会自动根据配置的同步策略执行同步操作。

## 结论

混合数据库客户端为应用提供了强大的离线数据处理能力，确保了在各种网络条件下的可靠性和一致性。通过合理配置同步策略和冲突解决方案，开发者可以创建出既能高效利用网络连接又能在离线环境下完美运行的应用。 