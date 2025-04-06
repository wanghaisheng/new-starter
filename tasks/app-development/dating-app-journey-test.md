# 约会应用用户旅程测试

## 测试目标
验证用户从注册到匹配的完整流程，确保应用提供流畅、直观且符合预期的用户体验。

## 测试环境
- 移动端应用
- 测试环境配置
- 模拟数据服务

## 测试场景

### 1. 用户注册流程
#### 1.1 邮箱注册
- [ ] 输入邮箱和密码
- [ ] 验证密码强度提示
- [ ] 验证邮箱格式
- [ ] 注册成功提示
- [ ] 自动登录并跳转

#### 1.2 手机号注册
- [ ] 输入手机号
- [ ] 发送验证码
- [ ] 输入验证码
- [ ] 设置密码
- [ ] 注册成功提示

### 2. 个性化测试流程
#### 2.1 八字命理测试
- [ ] 输入出生日期
- [ ] 输入出生时间
- [ ] 选择出生地点
- [ ] 选择性别
- [ ] 显示八字命盘
- [ ] 保存测试结果

#### 2.2 中医体质测试
- [ ] 回答体质相关问题
- [ ] 显示进度指示器
- [ ] 保存测试结果
- [ ] 显示体质分析

#### 2.3 MBTI性格测试
- [ ] 回答性格相关问题
- [ ] 显示进度指示器
- [ ] 保存测试结果
- [ ] 显示性格分析

#### 2.4 五行性格测试
- [ ] 回答五行相关问题
- [ ] 显示五行属性指示器
- [ ] 保存测试结果
- [ ] 显示五行分析

### 3. 匹配模式选择
- [ ] 显示所有匹配模式
- [ ] 选择八字命理匹配
- [ ] 选择中医体质匹配
- [ ] 选择MBTI性格匹配
- [ ] 选择全维度智能匹配
- [ ] 确认选择并开始匹配

### 4. 主界面交互
#### 4.1 卡片滑动
- [ ] 左滑不喜欢
- [ ] 右滑喜欢
- [ ] 上滑查看详情
- [ ] 下滑返回
- [ ] 动画流畅度

#### 4.2 用户信息展示
- [ ] 显示匹配度
- [ ] 显示体质标签
- [ ] 显示MBTI类型
- [ ] 显示五行属性
- [ ] 显示距离信息

#### 4.3 操作按钮
- [ ] 不喜欢按钮
- [ ] 喜欢按钮
- [ ] 超级喜欢按钮
- [ ] 返回按钮
- [ ] 更多选项按钮

### 5. 错误处理
#### 5.1 网络错误
- [ ] 显示网络错误提示
- [ ] 提供重试选项
- [ ] 支持离线模式
- [ ] 数据同步恢复

#### 5.2 系统维护
- [ ] 显示维护提示
- [ ] 显示预计恢复时间
- [ ] 提供稍后提醒选项

#### 5.3 版本更新
- [ ] 显示更新提示
- [ ] 列出新功能
- [ ] 提供立即更新选项

### 6. 性能测试
- [ ] 页面加载速度
- [ ] 图片加载优化
- [ ] 动画流畅度
- [ ] 内存占用
- [ ] 电池消耗

## 测试数据
- 测试用户账号
- 模拟匹配数据
- 测试图片资源
- 错误场景数据

## 预期结果
1. 所有测试场景都能正常完成
2. UI交互流畅，无卡顿
3. 错误处理得当，用户体验良好
4. 性能指标达标

## 测试工具
- 移动端测试设备
- 网络模拟器
- 性能监控工具
- 错误追踪工具

## 测试时间安排
- 准备阶段：1天
- 执行测试：3天
- 问题修复：2天
- 回归测试：1天

## 注意事项
1. 确保测试环境稳定
2. 记录所有异常情况
3. 关注用户体验细节
4. 及时反馈测试结果

## 1. 功能概述

### 1.1 核心功能
- 用户认证（注册/登录）
- 个人资料管理
- 匹配系统
- 消息系统
- 设置管理

### 1.2 数据存储策略
- Mock环境：使用内存存储，预设测试数据
- 本地环境：使用IndexedDB/SQLite，支持离线操作
- 生产环境：使用Firebase/Supabase，支持多设备同步

## 2. 用户旅程测试场景

### 2.1 用户认证流程

#### 2.1.1 新用户注册
```typescript
describe('新用户注册流程', () => {
  test('使用邮箱注册', async () => {
    // 1. 准备测试数据
    const userData = dataGenerator.generateComplexObject({
      email: 'email',
      password: 'string',
      name: 'string',
      birthDate: 'date',
      gender: 'string'
    });

    // 2. 执行注册
    const response = await registerUser(userData);

    // 3. 验证结果
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(response.data.email).toBe(userData.email);
  });

  test('使用社交账号注册', async () => {
    // TODO: 实现社交账号注册测试
  });
});
```

#### 2.1.2 用户登录
```typescript
describe('用户登录流程', () => {
  test('使用邮箱密码登录', async () => {
    // 1. 准备测试数据
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    // 2. 执行登录
    const response = await loginUser(credentials);

    // 3. 验证结果
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
  });

  test('记住登录状态', async () => {
    // TODO: 实现记住登录状态测试
  });
});
```

### 2.2 个人资料管理

#### 2.2.1 基础资料更新
```typescript
describe('个人资料更新', () => {
  test('更新基本信息', async () => {
    // 1. 准备测试数据
    const profileData = dataGenerator.generateComplexObject({
      name: 'string',
      bio: 'string',
      interests: ['string'],
      photos: ['url']
    });

    // 2. 执行更新
    const response = await updateProfile(profileData);

    // 3. 验证结果
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(profileData);
  });

  test('上传照片', async () => {
    // TODO: 实现照片上传测试
  });
});
```

### 2.3 匹配系统

#### 2.3.1 用户推荐
```typescript
describe('用户推荐系统', () => {
  test('获取推荐用户列表', async () => {
    // 1. 准备测试数据
    const preferences = {
      ageRange: { min: 18, max: 30 },
      distance: 50,
      interests: ['music', 'travel']
    };

    // 2. 获取推荐
    const response = await getRecommendedUsers(preferences);

    // 3. 验证结果
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('执行匹配操作', async () => {
    // TODO: 实现匹配操作测试
  });
});
```

### 2.4 消息系统

#### 2.4.1 聊天功能
```typescript
describe('聊天功能', () => {
  test('发送消息', async () => {
    // 1. 准备测试数据
    const messageData = {
      content: 'Hello!',
      type: 'text',
      receiverId: 'user123'
    };

    // 2. 发送消息
    const response = await sendMessage(messageData);

    // 3. 验证结果
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
  });

  test('获取聊天历史', async () => {
    // TODO: 实现聊天历史测试
  });
});
```

### 2.5 设置管理

#### 2.5.1 应用设置
```typescript
describe('应用设置', () => {
  test('更新通知设置', async () => {
    // 1. 准备测试数据
    const settings = {
      pushNotifications: true,
      emailNotifications: false,
      privacySettings: {
        showOnline: true,
        showLastActive: false
      }
    };

    // 2. 更新设置
    const response = await updateSettings(settings);

    // 3. 验证结果
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(settings);
  });
});
```

## 3. 数据同步测试

### 3.1 在线同步
```typescript
describe('在线数据同步', () => {
  test('实时数据更新', async () => {
    // 1. 准备测试数据
    const updateData = {
      profile: {
        status: 'online'
      }
    };

    // 2. 执行更新
    await updateProfile(updateData);

    // 3. 验证同步
    const syncStatus = await getSyncStatus();
    expect(syncStatus).toBe('completed');
  });
});
```

### 3.2 离线操作
```typescript
describe('离线数据操作', () => {
  test('离线编辑个人资料', async () => {
    // 1. 模拟离线环境
    await simulateOffline();

    // 2. 执行离线编辑
    const response = await updateProfile({
      bio: 'Updated bio'
    });

    // 3. 验证本地存储
    expect(response.status).toBe(200);
    expect(response.data.syncStatus).toBe('pending');

    // 4. 恢复在线状态
    await simulateOnline();

    // 5. 验证同步
    const syncStatus = await getSyncStatus();
    expect(syncStatus).toBe('completed');
  });
});
```

## 4. 性能测试

### 4.1 响应时间
```typescript
describe('性能测试', () => {
  test('页面加载时间', async () => {
    // 1. 测量页面加载
    const startTime = performance.now();
    await loadPage('/home');
    const endTime = performance.now();

    // 2. 验证性能
    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('数据操作响应时间', async () => {
    // TODO: 实现数据操作性能测试
  });
});
```

## 5. 测试环境配置

### 5.1 Mock环境
```typescript
const mockConfig = {
  database: {
    type: 'mock',
    name: 'dating_app_mock',
    version: 1
  },
  testData: {
    seed: 12345,
    cleanupBeforeTest: true,
    cleanupAfterTest: true
  }
};
```

### 5.2 本地环境
```typescript
const localConfig = {
  database: {
    type: 'indexeddb',
    name: 'dating_app_local',
    version: 1
  },
  testData: {
    cleanupBeforeTest: true,
    cleanupAfterTest: true
  }
};
```

### 5.3 生产环境
```typescript
const prodConfig = {
  database: {
    type: 'firebase',
    name: 'dating_app_prod',
    version: 1
  },
  testData: {
    cleanupBeforeTest: false,
    cleanupAfterTest: false
  }
};
```

## 6. 测试数据生成

### 6.1 用户数据
```typescript
const userSchema = {
  id: 'uuid',
  email: 'email',
  name: 'string',
  birthDate: 'date',
  gender: 'string',
  photos: ['url'],
  interests: ['string'],
  location: {
    latitude: 'number',
    longitude: 'number',
    city: 'string'
  },
  preferences: {
    ageRange: {
      min: 'number',
      max: 'number'
    },
    distance: 'number',
    interests: ['string']
  }
};
```

### 6.2 消息数据
```typescript
const messageSchema = {
  id: 'uuid',
  senderId: 'uuid',
  receiverId: 'uuid',
  content: 'string',
  type: 'string',
  status: 'string',
  createdAt: 'date',
  updatedAt: 'date'
};
```

## 7. 进度跟踪

### 7.1 已完成任务
- [x] 测试计划制定
- [x] 测试场景设计
- [x] 测试数据生成器配置

### 7.2 进行中任务
- [ ] 用户认证测试实现
- [ ] 个人资料测试实现
- [ ] 匹配系统测试实现

### 7.3 待开始任务
- [ ] 消息系统测试实现
- [ ] 设置管理测试实现
- [ ] 性能测试实现

## 8. 注意事项

1. 确保测试环境的隔离性
2. 实现测试数据的自动清理
3. 记录详细的测试日志
4. 定期更新测试用例
5. 保持测试代码的可维护性

## 9. 相关文档

- [数据库架构指南](../lessons/database/best-practise.md)
- [测试环境配置指南](../test-environment-guide.md)
- [性能测试规范](../performance-testing-guidelines.md) 