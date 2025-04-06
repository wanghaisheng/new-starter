# 测试开发指南

## 测试数据服务

### 测试数据服务架构

测试数据服务采用分层设计，支持多环境数据存储和同步：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现
│   ├── test/        # 测试数据服务实现
│   │   ├── test-data-service.ts  # 测试数据服务核心实现
│   │   ├── test-data-repository.ts  # 测试数据仓储实现
│   │   ├── test-data-schema.ts  # 测试数据模型定义
│   │   └── test-data-types.ts   # 测试数据类型定义
│   └── base-client.ts   # 基础客户端抽象
```

### 测试数据服务实现

1. **类型定义** (`test-data-types.ts`):
   - 定义测试数据相关的接口和类型
   - 包括测试结果、测试配置等类型定义

2. **数据模型** (`test-data-schema.ts`):
   - 定义测试数据的数据库模式
   - 包含同步配置和索引定义

3. **仓储实现** (`test-data-repository.ts`):
   - 实现测试数据的CRUD操作
   - 处理数据同步和冲突解决

4. **服务实现** (`test-data-service.ts`):
   - 提供测试数据管理的高层接口
   - 实现业务逻辑和数据处理

### 使用指南

1. **初始化测试数据服务**:
   ```typescript
   import { TestDataService } from '@/core/lib/db/clients/test/test-data-service';
   
   const testDataService = TestDataService.getInstance();
   ```

2. **创建测试数据**:
   ```typescript
   const testData = await testDataService.createTestData({
     userId: 'user123',
     testType: 'personality',
     results: {
       openness: 0.8,
       conscientiousness: 0.7,
       // ... 其他测试结果
     }
   });
   ```

3. **查询测试数据**:
   ```typescript
   const userTests = await testDataService.getUserTests('user123');
   const latestTest = await testDataService.getLatestTest('user123', 'personality');
   ```

4. **更新测试数据**:
   ```typescript
   await testDataService.updateTestResults('test123', {
     openness: 0.9,
     // ... 更新后的结果
   });
   ```

### 最佳实践

1. **数据同步**:
   - 使用离线优先策略
   - 实现自动冲突解决
   - 支持手动同步触发

2. **错误处理**:
   - 实现健壮的错误处理机制
   - 提供详细的错误信息
   - 支持重试机制

3. **性能优化**:
   - 使用批量操作
   - 实现数据缓存
   - 优化查询性能

4. **测试策略**:
   - 单元测试覆盖核心功能
   - 集成测试验证数据流
   - 端到端测试确保用户体验

### 常见问题

1. **如何处理测试数据冲突？**
   - 使用最后写入者获胜策略
   - 通过 `syncConfig` 自定义冲突解决
   - 支持手动解决冲突

2. **如何确保数据一致性？**
   - 使用事务确保原子性
   - 实现数据验证
   - 定期数据清理

3. **如何优化测试数据查询性能？**
   - 使用适当的索引
   - 实现查询缓存
   - 优化查询语句

### 示例代码

```typescript
// 创建测试数据
const createTestData = async (userId: string) => {
  const testData = await testDataService.createTestData({
    userId,
    testType: 'personality',
    results: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.6,
      agreeableness: 0.5,
      neuroticism: 0.4
    }
  });
  return testData;
};

// 获取用户最新测试结果
const getLatestTestResults = async (userId: string) => {
  const latestTest = await testDataService.getLatestTest(userId, 'personality');
  return latestTest?.results;
};

// 更新测试结果
const updateTestResults = async (testId: string, results: TestResults) => {
  await testDataService.updateTestResults(testId, results);
};
``` 