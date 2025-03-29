# Dating App 实现计划

## 1. 项目结构

### 1.1 目录结构
```
src/
├── app/
│   └── mobile/
├── assets/
│   ├── images/
│   └── locales/
├── core/
│   ├── components/          # 共享UI组件
│   │   ├── ProfileCard.tsx
│   │   ├── SwipeCard.tsx
│   │   ├── UserProfileCard.tsx
│   │   └── __tests__/
│   ├── config/
│   │   └── firebase.ts
│   ├── hooks/
│   ├── lib/
│   │   ├── api/
│   │   ├── db/
│   │   └── i18n/
│   ├── models/
│   │   ├── match.ts
│   │   ├── message.ts
│   │   ├── mock-data.ts
│   │   └── user.ts
│   ├── services/
│   │   ├── __tests__/
│   │   ├── camera-service.ts
│   │   ├── data-service-factory.ts
│   │   ├── data-service.interface.ts
│   │   ├── database-service.ts
│   │   ├── location-service.ts
│   │   ├── mock-data-service.ts
│   │   ├── network-service.ts
│   │   ├── storage-service.ts
│   │   ├── user-service.ts
│   │   └── validation-service.ts
│   ├── test/
│   │   ├── env.ts
│   │   ├── mock-indexeddb.ts
│   │   ├── test-utils.tsx
│   │   └── types.ts
│   └── types.ts
├── mobile/
│   ├── components/
│   │   └── cards/
│   ├── plugins/
│   │   ├── camera-service.ts
│   │   └── geolocation-service.ts
│   └── utils/
├── mock/
│   └── data/
│       └── user-data.ts
├── providers/
│   ├── index.tsx
│   └── ionic/
│       ├── index.tsx
│       └── index.tsx.bak
├── styles/
│   └── globals.css
├── test/
│   ├── env.ts
│   ├── setup.ts
│   └── test-utils.tsx
├── types/
│   └── bun.d.ts
├── utils/
└── web/
    └── components/
```

### 1.2 数据模型
```typescript
// 用户模型
interface User extends BaseEntity {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  photos: Photo[];
  bio?: string;
  interests: string[];
  location: Location;
  preferences: UserPreferences;
  isVerified: boolean;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
  activeDevices?: string[];
  lastActiveDevice?: string;
  sessionState?: {
    lastAction?: string;
    timestamp?: number;
    lastSync?: Date;
    [key: string]: any;
  };
}

// 照片模型
interface Photo extends BaseEntity {
  url: string;
  order: number;
  isMain: boolean;
  userId: string;
}

// 位置模型
interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// 用户偏好
interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number; // 最大距离（公里）
  gender: ('male' | 'female' | 'other')[];
  interests: string[];
}

// 匹配模型
interface Match extends BaseEntity {
  users: [string, string]; // 用户ID对
  status: 'pending' | 'matched' | 'rejected';
}

// 匹配操作模型
interface MatchAction extends BaseEntity {
  userId: string;
  targetUserId: string;
  action: 'like' | 'dislike' | 'superlike';
}

// 消息模型
interface Message extends BaseEntity {
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  status: 'sent' | 'delivered' | 'read';
}

// 举报模型
interface Report extends BaseEntity {
  reporterId: string;
  targetUserId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  resolution?: {
    action: 'warning' | 'suspension' | 'ban';
    note: string;
    resolvedAt: Date;
  };
}

// 屏蔽模型
interface Block extends BaseEntity {
  blockerId: string;
  blockedId: string;
  reason?: string;
  expiresAt?: Date;
}
```

## 1.3 数据库架构

### 1.3.1 数据库访问层

项目采用分层架构设计数据库访问层，主要包含以下组件：

```
src/core/lib/db/
├── clients/                # 数据库客户端实现
│   ├── base-client.ts      # 基础客户端抽象类
│   ├── capacitor-sqlite/   # SQLite客户端实现
│   ├── indexeddb/          # IndexedDB客户端实现
│   ├── firebase/           # Firebase客户端实现
│   └── mock/               # 模拟数据客户端
├── repositories/           # 仓储模式实现
│   ├── base-repository.ts  # 基础仓储抽象类
│   ├── user-repository.ts  # 用户仓储
│   ├── match-repository.ts # 匹配仓储
│   └── message-repository.ts # 消息仓储
├── schema/                 # 数据库模式定义
│   ├── definitions/        # 表结构定义
│   │   ├── user-schema.ts  # 用户表结构
│   │   ├── match-schema.ts # 匹配表结构
│   │   ├── message-schema.ts # 消息表结构
│   │   └── dating-schemas.ts # 其他相关表结构
│   ├── adapters/           # 数据库适配器
│   └── entity-converter.ts # 实体转换器
└── types/                  # 类型定义
    ├── base-entity.ts      # 基础实体类型
    ├── database.types.ts   # 数据库类型
    └── dating.ts           # 业务实体类型
```

### 1.3.2 Repository模式

项目采用Repository模式进行数据访问抽象，主要特点：

1. **抽象数据访问**：通过Repository接口隐藏数据访问细节
2. **领域驱动设计**：Repository与领域模型紧密结合
3. **可测试性**：便于单元测试和模拟

```typescript
// 基础仓储抽象类示例
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string
  ) {}
  
  async findById(id: string): Promise<T | null> {
    return this.client.findById<T>(this.tableName, id);
  }
  
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    return this.client.findAll<T>(this.tableName, filter);
  }
  
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    return this.client.create<T>(this.tableName, data as T);
  }
  
  async update(id: string, data: Partial<T>): Promise<void> {
    await this.client.update<T>(this.tableName, id, data);
  }
}
```

## 2. 实现阶段

### 2.1 第一阶段：基础架构（1周）

1. **数据库设置**
   - [ ] 实现数据模型
   - [ ] 设置数据库迁移
   - [ ] 配置数据同步

2. **认证系统**
   - [ ] 手机号认证
   - [ ] Google登录
   - [ ] 会话管理

3. **基础UI组件**
   - [ ] 导航栏
   - [ ] 卡片组件
   - [ ] 表单组件

### 2.2 第二阶段：核心功能（2周）

1. **个人资料**
   - [ ] 照片上传
   - [ ] 基本信息编辑
   - [ ] 兴趣标签

2. **匹配系统**
   - [ ] 用户推荐
   - [ ] 滑动操作
   - [ ] 匹配算法

3. **消息系统**
   - [ ] 聊天列表
   - [ ] 实时消息
   - [ ] 消息状态

### 2.3 第三阶段：高级功能（1周）

1. **设置系统**
   - [ ] 偏好设置
   - [ ] 隐私设置
   - [ ] 通知设置

2. **性能优化**
   - [ ] 图片优化
   - [ ] 数据缓存
   - [ ] 延迟加载

3. **离线支持**
   - [ ] 本地存储
   - [ ] 数据同步
   - [ ] 冲突处理

## 3. 测试计划

### 3.1 单元测试
```typescript
// 用户认证测试
describe('Authentication', () => {
  test('手机号注册', async () => {
    // 实现手机号注册测试
  });
  
  test('Google登录', async () => {
    // 实现Google登录测试
  });
});

// 个人资料测试
describe('Profile Management', () => {
  test('照片上传', async () => {
    // 实现照片上传测试
  });
  
  test('资料更新', async () => {
    // 实现资料更新测试
  });
});

// 匹配系统测试
describe('Matching System', () => {
  test('用户推荐', async () => {
    // 实现用户推荐测试
  });
  
  test('匹配操作', async () => {
    // 实现匹配操作测试
  });
});

// 消息系统测试
describe('Messaging System', () => {
  test('发送消息', async () => {
    // 实现消息发送测试
  });
  
  test('消息同步', async () => {
    // 实现消息同步测试
  });
});
```

### 3.2 集成测试
- [ ] 用户注册到匹配完整流程
- [ ] 匹配到聊天完整流程
- [ ] 设置更新到生效完整流程

### 3.3 性能测试
- [ ] 图片加载性能
- [ ] 消息发送延迟
- [ ] 数据同步效率

## 4. 部署计划

### 4.1 开发环境
- 使用Mock数据进行开发
- 本地数据库进行测试
- 自动化测试覆盖

### 4.2 测试环境
- 使用真实数据库
- 模拟真实用户行为
- 性能监控

### 4.3 生产环境
- 云端数据库部署
- CDN图片服务
- 实时消息服务

## 5. 监控计划

### 5.1 性能监控
- 页面加载时间
- API响应时间
- 资源使用情况

### 5.2 错误监控
- 客户端错误
- 服务器错误
- 网络错误

### 5.3 用户行为分析
- 功能使用率
- 用户留存率
- 转化率

## 6. 时间线

1. 第1周：基础架构
   - 数据库设置
   - 认证系统
   - 基础UI组件

2. 第2-3周：核心功能
   - 个人资料
   - 匹配系统
   - 消息系统

3. 第4周：高级功能
   - 设置系统
   - 性能优化
   - 离线支持

4. 第5周：测试与部署
   - 单元测试
   - 集成测试
   - 性能测试
   - 环境部署

## 7. 风险评估

### 7.1 技术风险
- 实时消息延迟
- 数据同步冲突
- 图片存储成本

### 7.2 业务风险
- 用户隐私保护
- 内容审核
- 用户安全

### 7.3 缓解措施
- 实现消息队列
- 使用版本控制
- 内容过滤系统
- 用户举报机制