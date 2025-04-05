# 离线功能测试

本目录包含所有针对应用程序离线功能的测试用例。这些测试确保应用在无网络连接或连接不稳定的环境下也能正常工作。

## 目录

本目录下的测试文件专注于验证以下功能：

1. 离线数据访问 - 应用能够在离线状态下访问本地缓存的数据
2. 离线操作队列 - 用户在离线状态下执行的操作被正确存储并排队
3. 网络恢复同步 - 当网络连接恢复时，应用能够自动同步离线操作
4. 冲突解决策略 - 处理本地和远程数据之间的冲突
5. 网络错误处理 - 应用能够优雅地处理网络错误

## 文件命名规范

所有离线测试文件应遵循以下命名规范：

```
[ServiceName].offline.test.tsx
```

例如：
- `UserService.offline.test.tsx`
- `MessageService.offline.test.tsx`

## 运行离线测试

```bash
# 运行所有离线测试
npm run test:offline

# 监视模式
npm run test:offline:watch

# 生成覆盖率报告
npm run test:offline:coverage
```

## 创建新的离线测试

可以使用提供的生成脚本快速创建新的离线测试：

```bash
npm run generate:offline-test ServiceName
```

例如：
```bash
npm run generate:offline-test MessageService
```

这将在当前目录创建 `MessageService.offline.test.tsx` 文件，其中包含基本的测试结构。

## 最佳实践

1. 使用 `jest.mock()` 模拟 `NetworkService` 和 `DatabaseService`
2. 使用 `beforeEach()` 重置所有模拟并设置测试环境
3. 测试离线和在线场景的转换
4. 确保模拟网络状态变化事件
5. 使用适当的断言验证缓存访问和同步行为

更多详细信息，请参阅 [离线功能测试指南](../../../docs/guides/offline-testing-guide.md)。 