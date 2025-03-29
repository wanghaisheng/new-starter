# 数据库测试工具

这个目录包含了一系列用于数据库测试的工具，包括测试数据生成器、测试环境管理器等。

## 目录结构

```
tools/
├── data-generator.ts    # 测试数据生成器
├── environment.ts       # 测试环境管理器
├── example.ts          # 使用示例
└── index.ts           # 主入口文件
```

## 主要功能

### 1. 测试数据生成器 (TestDataGenerator)

用于生成各种类型的测试数据，包括：

- 基本类型数据（字符串、数字、布尔值等）
- 复杂对象
- 边界值数据
- 无效数据

使用示例：
```typescript
const dataGenerator = TestDataGenerator.getInstance();

// 生成基本类型数据
const string = dataGenerator.generateBasicType('string');
const number = dataGenerator.generateBasicType('number');

// 生成复杂对象
const user = dataGenerator.generateComplexObject({
  name: 'string',
  age: 'number',
  email: 'email',
});

// 生成边界值数据
const boundaryValue = dataGenerator.generateBoundaryValue('string', 'min');

// 生成无效数据
const invalidData = dataGenerator.generateInvalidData('string', 'format');
```

### 2. 测试环境管理器 (TestEnvironmentManager)

用于管理测试环境配置，包括：

- 数据库配置
- 测试数据配置
- 性能监控配置
- 测试工具配置

使用示例：
```typescript
const envManager = TestEnvironmentManager.getInstance();

// 更新配置
envManager.updateConfig({
  database: {
    type: 'sqlite',
    name: 'test_db',
    version: 1,
  },
  testData: {
    cleanupBeforeTest: true,
    cleanupAfterTest: true,
  },
});

// 获取配置
const config = envManager.getConfig();
```

### 3. 测试工具集合 (TestTools)

整合了所有测试工具，提供了统一的接口：

- 初始化测试环境
- 获取测试工具实例
- 清理测试环境

使用示例：
```typescript
const testTools = TestTools.getInstance();

// 初始化测试环境
await testTools.initialize();

try {
  // 获取测试工具实例
  const envManager = testTools.getEnvironmentManager();
  const dataGenerator = testTools.getDataGenerator();

  // 使用测试工具...

} finally {
  // 清理测试环境
  await testTools.cleanup();
}
```

## 完整示例

查看 `example.ts` 文件获取完整的使用示例。

## 注意事项

1. 所有工具类都使用单例模式，通过 `getInstance()` 方法获取实例
2. 测试环境初始化后，务必在 `finally` 块中调用 `cleanup()` 方法清理环境
3. 使用 `TestTools` 类可以更方便地管理整个测试生命周期
4. 配置更新时会自动进行类型验证，确保配置的正确性

## 待办事项

- [ ] 实现测试数据清理功能
- [ ] 实现性能监控功能
- [ ] 实现代码覆盖率收集
- [ ] 实现性能测试功能
- [ ] 添加更多测试数据生成器
- [ ] 完善错误处理机制
- [ ] 添加测试报告生成功能 