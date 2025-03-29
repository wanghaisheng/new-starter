# Dating App 实现计划

## 1. 项目结构与设计

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

### 1.3 UI/UX 设计

根据原型设计，应用将采用现代化的UI设计，主要特点包括：

#### 1.3.1 设计风格

- **色彩方案**：以深色背景（slate-900）为主，搭配粉色（pink-600）作为主要强调色
- **卡片设计**：采用玻璃态（glass-card）效果，增强视觉层次感
- **圆角元素**：大量使用圆角设计，提升友好度和现代感
- **渐变背景**：使用渐变色背景增强视觉吸引力

#### 1.3.2 主要界面

1. **登录/注册界面**
   - 手机号注册选项
   - Google账号登录选项
   - 简洁的表单设计

2. **个人资料设置**
   - 多照片上传界面（至少2张照片）
   - 个人信息编辑表单
   - 兴趣标签选择界面

3. **主滑动界面**
   - 卡片式用户展示
   - 左右滑动交互
   - 底部操作按钮（喜欢/不喜欢）
   - 照片指示器

4. **匹配成功界面**
   - 匹配通知动画
   - 用户头像展示
   - 发送消息/继续滑动选项

5. **聊天列表界面**
   - 最近消息预览
   - 在线状态指示
   - 搜索功能

6. **聊天对话界面**
   - 气泡式消息展示
   - 消息时间戳
   - 消息输入框
   - 多媒体内容支持

7. **用户资料界面**
   - 照片展示
   - 个人简介
   - 兴趣标签
   - 基本信息展示

8. **设置界面**
   - 账户设置
   - 偏好设置
   - 隐私设置
   - 通知设置
   - 支持与法律信息

#### 1.3.3 交互设计

1. **滑动交互**
   - 向右滑动表示喜欢
   - 向左滑动表示不喜欢
   - 向上滑动表示超级喜欢

2. **手势操作**
   - 点击照片查看详情
   - 长按显示更多选项
   - 下拉刷新内容

3. **动画效果**
   - 匹配成功庆祝动画
   - 平滑的页面过渡
   - 加载状态指示

4. **反馈机制**
   - 操作成功提示
   - 错误信息展示
   - 引导性提示

## 1.4 数据库架构

### 1.4.1 数据库访问层

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

### 1.4.2 Repository模式

项目采用Repository模式进行数据访问抽象，主要特点：

1. **抽象数据访问**：通过Repository接口隐藏数据访问细节
2. **领域驱动设计**：Repository与领域模型紧密结合
3. **可测试性**：便于单元测试和模拟
4. **关注点分离**：数据访问逻辑与业务逻辑分离
5. **依赖倒置**：高层模块不依赖于低层模块的具体实现

```typescript
// 基础仓储接口
export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, any>): Promise<T[]>;
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  count(filter?: Record<string, any>): Promise<number>;
  exists(id: string): Promise<boolean>;
  transaction<R>(callback: (repo: IRepository<T>) => Promise<R>): Promise<R>;
}

// 基础仓储抽象类示例
export abstract class BaseRepository<T extends BaseEntity> implements IRepository<T> {
  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string,
    protected entityConverter: EntityConverter<T>
  ) {}
  
  async findById(id: string): Promise<T | null> {
    const data = await this.client.findById<Record<string, any>>(this.tableName, id);
    return data ? this.entityConverter.fromDatabase(data) : null;
  }
  
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    const data = await this.client.findAll<Record<string, any>>(this.tableName, filter);
    return data.map(item => this.entityConverter.fromDatabase(item));
  }
  
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    const dbData = this.entityConverter.toDatabase(data as T);
    const result = await this.client.create<Record<string, any>>(this.tableName, dbData);
    return this.entityConverter.fromDatabase(result);
  }
  
  async update(id: string, data: Partial<T>): Promise<void> {
    const dbData = this.entityConverter.toDatabase(data as T, true);
    await this.client.update<Record<string, any>>(this.tableName, id, dbData);
  }
  
  async delete(id: string): Promise<void> {
    await this.client.delete(this.tableName, id);
  }
  
  async count(filter?: Record<string, any>): Promise<number> {
    return this.client.count(this.tableName, filter);
  }
  
  async exists(id: string): Promise<boolean> {
    return this.client.exists(this.tableName, id);
  }
  
  async transaction<R>(callback: (repo: IRepository<T>) => Promise<R>): Promise<R> {
    return this.client.transaction(async (transactionClient) => {
      const transactionRepo = this.createTransactionRepository(transactionClient);
      return callback(transactionRepo);
    });
  }
  
  protected abstract createTransactionRepository(transactionClient: IBaseDatabaseClient): IRepository<T>;
}

// 实体转换器
export interface EntityConverter<T> {
  fromDatabase(data: Record<string, any>): T;
  toDatabase(entity: Partial<T>, isUpdate?: boolean): Record<string, any>;
}
```

### 1.4.3 数据访问策略

项目采用多层数据访问策略，确保在不同环境下的一致性体验：

#### 1.4.3.1 三阶段数据访问

| 阶段 | 环境变量 | 主要目的 | 关注点 |
|------|---------|---------|--------|
| Mock数据 | NEXT_PUBLIC_DATABASE_ENV=mock | 需求确认与快速原型 | 数据结构、字段定义、关联关系 |
| 本地数据库 | NEXT_PUBLIC_DATABASE_ENV=local | 功能验证与性能测试 | 数据持久化、查询性能、事务处理 |
| 生产环境 | NEXT_PUBLIC_DATABASE_ENV=production | 正式部署与多用户支持 | 安全性、可扩展性、数据同步 |

##### 1.4.3.1.1 Mock数据阶段

**实现方式**

1. **Mock客户端实现**：使用`src/core/lib/db/clients/mock/mock-client.ts`提供内存数据存储
2. **预设数据**：在`src/mock/data/`目录下创建JSON格式的模拟数据
3. **环境配置**：在`.env.development`中设置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=mock
   NEXT_PUBLIC_MOCK_DB_TYPE=memory  # 或 json
   ```

**优势**
- 快速开发和测试UI组件，无需实际数据库环境
- 可预设各种测试场景的数据
- 开发环境一致性，避免环境差异导致的问题

**测试策略**
- 单元测试：验证Mock数据服务接口完整性
- 组件测试：使用Mock数据验证UI渲染
- 集成测试：验证业务逻辑与Mock数据交互

##### 1.4.3.1.2 本地数据库阶段

**实现方式**

1. **本地客户端实现**：使用`src/core/lib/db/clients/indexeddb/indexeddb-client.ts`提供浏览器端持久化存储
2. **数据迁移**：实现从Mock数据到本地数据库的迁移
3. **环境配置**：在`.env.local`中设置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=local
   NEXT_PUBLIC_LOCAL_DB_TYPE=indexeddb  # 或 sqlite
   ```

**优势**
- 数据持久化，支持应用重启后数据保留
- 可测试实际数据库操作性能
- 支持离线操作和本地缓存

**测试策略**
- 性能测试：验证数据库操作响应时间
- 边界测试：测试大数据量和并发操作
- 持久化测试：验证数据在应用重启后的一致性

##### 1.4.3.1.3 生产环境阶段

**实现方式**

1. **云端客户端实现**：根据部署环境选择适当的客户端：
   - Web环境：`src/core/lib/db/clients/firebase/firebase-client.ts`
   - 移动端：`src/core/lib/db/clients/capacitor-sqlite/sqlite-client.ts`
   - 混合模式：`src/core/lib/db/clients/hybrid/hybrid-database-client.ts`

2. **数据同步**：实现本地数据与云端数据的双向同步

3. **环境配置**：在`.env.production`中设置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=production
   NEXT_PUBLIC_CLOUD_DB_TYPE=firebase  # 或 supabase, cloudflare_d1
   NEXT_PUBLIC_CLOUD_DB_URL=your_db_url
   NEXT_PUBLIC_CLOUD_DB_KEY=your_db_key
   ```

**优势**
- 多用户数据共享和实时更新
- 数据安全性和备份机制
- 可扩展性和高可用性

**测试策略**
- 负载测试：验证高并发下的系统性能
- 同步测试：验证在线/离线状态切换时的数据一致性
- 安全测试：验证数据访问权限控制

#### 1.4.3.2 数据服务工厂

```typescript
// 数据服务工厂
export class DataServiceFactory {
  private static instance: DataServiceFactory;
  private services: Map<string, any> = new Map();
  private databaseEnv: 'mock' | 'local' | 'production';
  
  private constructor() {
    this.databaseEnv = (process.env.NEXT_PUBLIC_DATABASE_ENV as any) || 'mock';
  }
  
  static getInstance(): DataServiceFactory {
    if (!DataServiceFactory.instance) {
      DataServiceFactory.instance = new DataServiceFactory();
    }
    return DataServiceFactory.instance;
  }
  
  async getUserService(): Promise<IUserService> {
    if (!this.services.has('user')) {
      switch (this.databaseEnv) {
        case 'production':
          this.services.set('user', await this.createCloudUserService());
          break;
        case 'local':
          this.services.set('user', await this.createLocalUserService());
          break;
        default:
          this.services.set('user', await this.createMockUserService());
      }
    }
    return this.services.get('user');
  }
  
  // 其他服务获取方法...
  
  private async createCloudUserService(): Promise<IUserService> {
    const client = await this.getCloudDatabaseClient();
    const repository = new CloudUserRepository(client);
    return new UserService(repository);
  }
  
  private async createLocalUserService(): Promise<IUserService> {
    const client = await this.getLocalDatabaseClient();
    const repository = new LocalUserRepository(client);
    return new UserService(repository);
  }
  
  private async createMockUserService(): Promise<IUserService> {
    return new MockUserService();
  }
  
  // 数据库客户端获取方法...
}
```
```

## 2. 实现阶段

### 2.1 第一阶段：基础架构（1周）

1. **数据库设置**
   - [ ] 实现数据模型
     - 创建用户、照片、位置、偏好等核心模型
     - 实现模型之间的关联关系
     - 添加数据验证逻辑
   - [ ] 设置数据库迁移
     - 创建初始化脚本
     - 实现版本控制机制
     - 设计增量更新策略
     - 开发模式检测与自动升级
     - 实现数据备份与恢复
     - 添加迁移日志记录
   - [ ] 配置数据同步
     - 实现在线/离线数据同步
     - 设计冲突解决策略
     - 优化同步性能
     - 实现增量同步机制
     - 添加同步状态监控
     - 开发网络状态感知

2. **认证系统**
   - [ ] 手机号认证
     - 实现短信验证码发送
     - 开发验证码验证流程
     - 添加安全限制防止滥用
   - [ ] Google登录
     - 集成Google OAuth API
     - 实现授权流程
     - 处理用户信息获取
   - [ ] 会话管理
     - 实现JWT令牌机制
     - 开发会话过期处理
     - 添加多设备登录支持

3. **基础UI组件**
   - [ ] 导航栏
     - 实现底部标签导航
     - 添加页面标题和返回按钮
     - 支持自定义操作按钮
   - [ ] 卡片组件
     - 开发用户资料卡片
     - 实现滑动卡片交互
     - 添加照片轮播功能
   - [ ] 表单组件
     - 创建输入字段组件
     - 实现表单验证
     - 开发日期选择器和兴趣选择器

### 2.2 第二阶段：核心功能（2周）

1. **个人资料**
   - [ ] 照片上传
     - 实现多照片上传功能
     - 添加照片编辑和排序
     - 开发照片质量优化
     - 实现照片审核机制
   - [ ] 基本信息编辑
     - 创建个人资料表单
     - 实现生日和年龄计算
     - 添加位置信息获取
     - 开发资料完整度指示
   - [ ] 兴趣标签
     - 实现兴趣标签选择界面
     - 开发自定义标签功能
     - 添加热门标签推荐
     - 实现标签搜索功能

2. **匹配系统**
   - [ ] 用户推荐
     - 实现基于位置的用户筛选
     - 开发基于偏好的推荐算法
     - 添加用户活跃度权重
     - 实现推荐结果缓存
   - [ ] 滑动操作
     - 开发左右滑动交互
     - 实现超级喜欢功能
     - 添加撤销操作支持
     - 开发滑动动画效果
   - [ ] 匹配算法
     - 实现双向匹配逻辑
     - 开发匹配通知机制
     - 添加匹配分数计算
     - 实现匹配优先级排序

3. **消息系统**
   - [ ] 聊天列表
     - 实现最近消息排序
     - 开发未读消息提示
     - 添加在线状态显示
     - 实现消息预览功能
   - [ ] 实时消息
     - 集成WebSocket通信
     - 实现消息发送和接收
     - 添加消息推送通知
     - 开发离线消息存储
   - [ ] 消息状态
     - 实现已发送/已送达/已读状态
     - 开发消息撤回功能
     - 添加消息时间戳
     - 实现敏感内容过滤

### 2.3 第三阶段：高级功能（1周）

1. **设置系统**
   - [ ] 偏好设置
     - 实现年龄范围选择
     - 开发距离筛选设置
     - 添加性别偏好选项
     - 实现兴趣偏好设置
   - [ ] 隐私设置
     - 开发个人资料可见性控制
     - 实现位置信息精确度设置
     - 添加屏蔽和举报功能
     - 开发账户暂停选项
   - [ ] 通知设置
     - 实现消息通知控制
     - 开发匹配通知设置
     - 添加系统通知选项
     - 实现免打扰模式

2. **性能优化**
   - [ ] 图片优化
     - 实现图片压缩和裁剪
     - 开发渐进式加载
     - 添加图片缓存机制
     - 实现图片预加载策略
   - [ ] 数据缓存
     - 开发本地数据缓存
     - 实现缓存过期策略
     - 添加缓存清理机制
     - 开发缓存优先加载
   - [ ] 延迟加载
     - 实现列表虚拟滚动
     - 开发图片懒加载
     - 添加内容分页加载
     - 实现后台数据预取

3. **离线支持**
   - [ ] 本地存储
     - 实现IndexedDB数据存储
     - 开发本地数据加密
     - 添加存储空间管理
     - 实现数据备份恢复
     - 开发存储配额监控
     - 实现数据压缩策略
   - [ ] 数据同步
     - 开发增量同步机制
     - 实现后台同步服务
     - 添加同步状态指示
     - 开发网络状态监测
     - 实现优先级同步队列
     - 添加同步频率控制
     - 开发断点续传功能
   - [ ] 冲突处理
     - 实现乐观锁机制
     - 开发冲突检测算法
     - 添加冲突解决策略
     - 实现用户冲突提示
     - 开发三向合并算法
     - 添加冲突历史记录
     - 实现自动冲突解决

## 3. 测试计划

### 3.1 单元测试

```typescript
// 用户认证测试
describe('Authentication', () => {
  test('手机号注册流程', async () => {
    // 模拟手机号输入
    const phone = '+8613800138000';
    const verificationCode = '123456';
    
    // 模拟验证码发送
    const sendResult = await authService.sendVerificationCode(phone);
    expect(sendResult.success).toBe(true);
    
    // 模拟验证码验证
    const verifyResult = await authService.verifyCode(phone, verificationCode);
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.user).toBeDefined();
  });
  
  test('Google登录流程', async () => {
    // 模拟Google OAuth返回数据
    const mockGoogleData = {
      id: 'google123',
      email: 'user@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg'
    };
    
    // 模拟Google登录
    const loginResult = await authService.loginWithGoogle(mockGoogleData);
    expect(loginResult.success).toBe(true);
    expect(loginResult.user).toBeDefined();
    expect(loginResult.token).toBeDefined();
  });
  
  test('会话过期处理', async () => {
    // 模拟过期令牌
    const expiredToken = 'expired.jwt.token';
    
    // 验证令牌状态
    const tokenStatus = await authService.verifyToken(expiredToken);
    expect(tokenStatus.valid).toBe(false);
    expect(tokenStatus.expired).toBe(true);
    
    // 测试刷新令牌
    const refreshResult = await authService.refreshToken(expiredToken);
    expect(refreshResult.success).toBe(true);
    expect(refreshResult.newToken).toBeDefined();
  });
});

// 个人资料测试
describe('Profile Management', () => {
  test('照片上传与处理', async () => {
    // 模拟照片文件
    const mockFile = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    
    // 测试照片上传
    const uploadResult = await profileService.uploadPhoto(userId, mockFile);
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.photo).toBeDefined();
    expect(uploadResult.photo.url).toContain('test');
    
    // 测试照片排序
    const reorderResult = await profileService.reorderPhotos(userId, [uploadResult.photo.id, 'existing-photo-id']);
    expect(reorderResult.success).toBe(true);
  });
  
  test('资料更新与验证', async () => {
    // 模拟个人资料数据
    const profileData = {
      name: 'New Name',
      birthDate: new Date('1995-01-01'),
      bio: 'Updated bio information',
      interests: ['hiking', 'photography']
    };
    
    // 测试资料更新
    const updateResult = await profileService.updateProfile(userId, profileData);
    expect(updateResult.success).toBe(true);
    
    // 验证更新后的数据
    const profile = await profileService.getProfile(userId);
    expect(profile.name).toBe(profileData.name);
    expect(profile.birthDate).toEqual(profileData.birthDate);
    expect(profile.interests).toEqual(expect.arrayContaining(profileData.interests));
  });
});

// 匹配系统测试
describe('Matching System', () => {
  test('用户推荐算法', async () => {
    // 设置用户偏好
    const preferences = {
      ageRange: { min: 25, max: 35 },
      distance: 10,
      gender: ['female'],
      interests: ['travel', 'music']
    };
    
    // 获取推荐用户
    const recommendations = await matchService.getRecommendations(userId, preferences);
    expect(recommendations.length).toBeGreaterThan(0);
    
    // 验证推荐用户符合偏好
    for (const user of recommendations) {
      const age = calculateAge(user.birthDate);
      expect(age).toBeGreaterThanOrEqual(preferences.ageRange.min);
      expect(age).toBeLessThanOrEqual(preferences.ageRange.max);
      expect(preferences.gender).toContain(user.gender);
    }
  });
  
  test('匹配操作与通知', async () => {
    // 模拟用户喜欢操作
    const likeResult = await matchService.likeUser(userId, targetUserId);
    expect(likeResult.success).toBe(true);
    
    // 模拟目标用户已经喜欢当前用户的情况
    const mockExistingLike = true;
    if (mockExistingLike) {
      // 验证是否创建了匹配
      const match = await matchService.getMatch(userId, targetUserId);
      expect(match).toBeDefined();
      expect(match.status).toBe('matched');
      
      // 验证是否发送了匹配通知
      const notifications = await notificationService.getUserNotifications(userId);
      const matchNotification = notifications.find(n => n.type === 'match' && n.data.targetUserId === targetUserId);
      expect(matchNotification).toBeDefined();
    }
  });
});

// 消息系统测试
describe('Messaging System', () => {
  test('发送消息与状态更新', async () => {
    // 创建测试消息
    const messageContent = 'Hello, this is a test message';
    
    // 发送消息
    const sendResult = await messageService.sendMessage(matchId, senderId, messageContent);
    expect(sendResult.success).toBe(true);

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