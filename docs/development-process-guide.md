# 开发流程指南

> 版本兼容性：本文档必须与[guideline.md](../guideline.md) v1.1+ 保持同步  
> 最后同步时间：2025-03-28


本文档整合了项目开发过程中的各种流程和规范，为团队成员提供统一的开发指导。

## 0. 项目初始化检查

在首次克隆项目或未确认项目初始化状态时，请运行环境检查脚本：

```bash
bash docs/tasks/tools/check-environment.sh
```

如果检查发现问题，请按照脚本输出的建议进行修复。详细的初始化指南请参考 [项目初始化指南](./project-initialization-guide.md)。

脚本会在环境检查通过后创建初始化完成标记（`.env.local` 文件中的 `NEXT_PUBLIC_ENV_INITIALIZED=true`），后续开发无需再次运行环境检查。

如果需要强制重新检查环境，可以使用 `--force` 参数：

```bash
bash docs/tasks/tools/check-environment.sh --force
```

## 1. 功能开发流程

### 1.1 需求分析与规划

当收到新的功能需求时，应遵循以下步骤：

1. **需求分析**：与产品经理/客户沟通，明确功能需求和优先级
2. **技术可行性评估**：评估现有技术栈是否支持，是否需要引入新依赖
3. **创建功能任务计划**：使用[功能任务计划模板](./templates/feature-task-plan-template.md)创建详细的任务计划文件

### 1.2 任务拆解与跟踪

1. 将功能拆分为多个独立的子任务，每个子任务应有：
   - 明确的描述和完成标准
   - 预估工时
   - 指定负责人
   - 优先级和依赖关系

2. 开发过程中及时更新子任务状态，确保任务计划反映最新进度

### 1.3 问题记录与解决

1. 在任务计划文档的问题记录部分记录开发过程中遇到的问题
2. 问题解决后，记录解决方案并总结经验教训
3. 定期回顾问题记录，识别常见问题模式并改进开发流程

## 1.4 版本控制

### 提交消息格式：
- 类型(feat|fix|docs|style|refactor|test|chore): 简要描述
- 空行
- 详细说明（可选）
- 空行
- 关联问题编号（如Closes #123）

示例：
\`\`\`
feat: 添加用户认证模块

实现JWT基础认证流程
包含登录/注册/令牌刷新功能

Closes #45
\`\`\`
### 1.5 自动化脚本

1. **脚本存放位置**：统一放在`docs/tasks/tools/`目录
2. **命名要求**：使用`<功能>-<操作>.sh`格式，如`setup-database.sh`
3. **输出规范**：
   - 成功执行应输出绿色✅标记
   - 失败应输出红色❌标记及解决建议
4. **结果记录**：自动生成`<脚本名>-<时间戳>.log`文件
5. **学习资源**：脚本编写参考资料位于`docs/lessons/bash/`目录

所有开发工作必须遵循项目的[Git分支管理策略](./git-branch-strategy.md)，确保代码变更有序且可追踪。主要包括：

- 分支命名规范
- 提交信息格式
- 合并请求流程
- 版本标记规则

### 1.5 自动化脚本

为提高开发效率和确保环境一致性，项目鼓励使用自动化脚本：

1. **环境设置脚本**：在 `docs/tasks/` 目录下创建与任务相关的自动化脚本
2. **脚本命名规范**：使用 `<功能>-<操作>.sh` 格式命名脚本
3. **结果记录**：脚本执行结果应输出到同目录下的 `<脚本名>-results.txt` 文件
4. **脚本文档**：在任务计划文档中说明脚本用途和执行方式

示例：
- Git 仓库初始化脚本：`docs/tasks/tools/init-git-repo.sh`
- 依赖安装脚本：`docs/tasks/tools/install-dependencies.sh`
- 测试运行脚本：`docs/tasks/run-tests.sh`

## 2. 数据库开发流程

数据库开发遵循渐进式流程，从Mock数据到生产环境数据库。这三个阶段构成了一个连续的开发流程，理想情况下，只需通过切换环境变量即可在不同阶段间无缝切换，而无需修改业务代码。这种设计确保了在开发初期就能确认数据库表字段和关联关系，随后在本地环境进行测试验证，最终无缝过渡到生产环境。

### 2.1 数据库架构

#### 2.1.1 数据库访问层

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
│   │   └── message-schema.ts # 消息表结构
│   ├── adapters/           # 数据库适配器
│   └── entity-converter.ts # 实体转换器
├── factory.ts              # 数据库工厂
├── service.ts              # 数据库服务
└── types/                  # 类型定义
    ├── base-entity.ts      # 基础实体类型
    ├── database.types.ts   # 数据库类型
    └── dating.ts           # 业务实体类型
```

#### 2.1.2 核心组件

1. **Schema Registry**：负责管理所有表结构定义，提供统一的注册和访问接口
2. **数据库工厂**：负责创建和管理数据库客户端实例，根据环境变量选择合适的客户端类型
3. **数据库服务**：应用程序与数据库交互的主要入口点，管理数据库客户端和仓储实例
4. **数据服务工厂**：负责创建和管理数据服务实例，根据环境变量选择合适的服务实现

#### 2.1.3 Repository模式

Repository模式是一种数据访问模式，它在领域模型和数据映射层之间提供了一个中间层，使得应用程序可以独立于底层数据存储技术。在我们的项目中，Repository模式的实现基于以下原则：

1. **单一职责**：每个Repository只负责一种实体类型的数据访问
2. **接口一致性**：所有Repository实现相同的基础接口
3. **业务逻辑隔离**：数据访问逻辑与业务逻辑分离
4. **可测试性**：便于单元测试和模拟

### 2.2 Mock数据阶段

#### 目的
- 快速开发和测试UI组件
- 验证业务逻辑
- 不依赖实际数据库环境

#### 实现方式
1. 在`src/mock/data/`目录下创建JSON格式的模拟数据
2. 实现Mock数据服务，提供与真实服务相同的接口
3. 在`.env.development`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=mock
   NEXT_PUBLIC_MOCK_DB_TYPE=memory  # 或 json
   ```

#### 验收标准
- [ ] Mock数据服务接口完整
- [ ] 数据结构符合设计规范
- [ ] 测试用例覆盖主要场景

### 2.3 本地数据库阶段

#### 目的
- 实现本地数据持久化
- 测试数据库操作性能
- 验证数据模型设计

#### 实现方式
1. 设计数据库Schema
2. 创建数据库迁移脚本
3. 实现本地数据库服务
4. 在`.env.local`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=local
   NEXT_PUBLIC_LOCAL_DB_TYPE=sqlite  # 或 indexeddb
   ```

#### 验收标准
- [ ] 数据库Schema设计合理
- [ ] 迁移脚本可重复执行
- [ ] CRUD操作性能达标

### 2.4 生产环境数据库阶段

#### 目的
- 实现数据云端存储
- 支持多用户访问
- 确保数据安全性

#### 实现方式
1. 选择云端数据库服务：
   - Firebase Realtime Database/Firestore
   - Supabase
   - Cloudflare D1

2. 在`.env.production`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=production
   NEXT_PUBLIC_CLOUD_DB_TYPE=supabase  # 或 firebase, cloudflare_d1
   NEXT_PUBLIC_CLOUD_DB_URL=your_db_url
   NEXT_PUBLIC_CLOUD_DB_KEY=your_db_key
   
   # 离线存储配置
   NEXT_PUBLIC_OFFLINE_STORAGE_TYPE=indexeddb  # 可选: capacitor-sqlite, indexeddb, localstorage, websql
   NEXT_PUBLIC_OFFLINE_STORAGE_NAME=app_db
   NEXT_PUBLIC_OFFLINE_STORAGE_VERSION=1
   ```

3. 实现云端数据库服务和离线数据存储（移动端使用Capacitor SQLite，Web端使用IndexedDB）

#### 验收标准
- [ ] 数据库连接稳定可靠
- [ ] 查询性能满足要求
- [ ] 数据安全性符合标准
- [ ] 离线数据访问正常
- [ ] 数据同步机制可靠

### 2.5 环境切换与错误处理

为确保在不同数据库环境之间平滑切换，请遵循以下最佳实践：

1. **服务初始化检查**：所有数据库服务必须在初始化时检查配置的完整性
2. **优雅降级策略**：当高级功能不可用时，应自动回退到基础功能
3. **详细日志**：记录当前使用的数据库环境和初始化状态
4. **错误恢复机制**：提供自动重试和手动恢复选项

#### 环境切换命令

在开发过程中，可以通过以下方式在不同数据库环境之间切换：

1. **环境变量文件**：
   - `.env.development` - 开发环境（默认包含 mock 配置）
   - `.env.local` - 本地开发环境
   - `.env.production` - 生产环境

2. **启动命令**：
   ```bash
   # 开发环境（Mock数据）
   bun run dev
   
   # 本地数据库环境
   NODE_ENV=local bun run dev
   
   # 生产环境
   NODE_ENV=production bun run dev
   # 或者构建后运行
   bun run build
   bun run start
   ```

### 2.6 新增表流程

当需要新增一个表时，需要在几个地方进行更新，但我们的架构设计使这个过程相对简单和一致。

#### 2.6.1 创建新的表结构定义

首先，在 `schema/definitions/` 目录下创建一个新的表结构定义文件：

```typescript
// src/core/lib/db/schema/definitions/notification-schema.ts
import { schemaRegistry, TableSchema } from '../registry';

// 通知表结构定义
const notificationSchema: TableSchema = {
  name: 'notifications',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    // 其他列定义...
  ],
  indexes: [
    // 索引定义...
  ]
};

// 注册表结构
schemaRegistry.register(notificationSchema);

export default notificationSchema;
```

#### 2.6.2 更新 drizzle-schema.ts 文件

接下来，更新 `drizzle-schema.ts` 文件，导入并导出新表的结构。

#### 2.6.3 创建数据模型

创建一个新的数据模型类。

#### 2.6.4 创建仓储类

为新表创建一个仓储类。

#### 2.6.5 更新 DatabaseService 类

最后，更新 DatabaseService 类，添加新的仓储和相关方法。

### 2.7 组件与页面数据访问模式

在应用开发中，组件和页面必须通过统一的数据服务接口访问数据，而不是直接导入模型或mock数据。这种模式有以下优势：

1. **环境适应性**：根据环境变量自动切换数据源（mock、local、production）
2. **关注点分离**：UI组件专注于展示逻辑，数据访问逻辑封装在服务中
3. **可测试性**：便于模拟数据服务进行单元测试
4. **一致性**：确保所有组件使用相同的数据访问方式
5. **可维护性**：当数据访问逻辑变更时，只需修改服务实现，而不影响UI组件

#### 正确的数据访问示例

```typescript
// 使用数据服务工厂
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { useEffect, useState } from 'react';
import { User } from '@/core/types';

function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // 通过工厂获取服务实例，自动根据环境变量选择合适的实现
        const userService = await DataServiceFactory.getInstance().getUserService();
        const recommendedUsers = await userService.getRecommendedUsers();
        setUsers(recommendedUsers);
        setError(null);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('无法加载推荐用户');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  // 组件渲染逻辑...
}
```

### 2.8 数据同步冲突解决策略

在多设备、多用户环境下，数据同步冲突是不可避免的。常见的冲突类型包括：

1. **更新冲突**：多个客户端同时更新同一条记录
2. **删除冲突**：一个客户端删除记录，另一个客户端更新该记录
3. **插入冲突**：多个客户端插入具有相同ID的记录
4. **结构冲突**：客户端和服务器的数据结构不一致

项目实现了多种冲突解决策略：

- **服务器优先**：使用服务器版本
- **客户端优先**：使用客户端版本
- **合并**：合并两个版本
- **自定义**：使用自定义合并函数

详细的冲突解决实现请参考 `src/core/lib/db/clients/firebase/firebase-conflict.ts`。

### 2.9 开发工作流程检查清单

#### 数据库开发前

- [ ] 确定数据模型和关系
- [ ] 设计表结构和索引
- [ ] 确定数据访问模式
- [ ] 评估性能需求

#### Mock数据阶段

- [ ] 创建模拟数据文件
- [ ] 实现Mock数据服务
- [ ] 编写单元测试
- [ ] 验证UI和业务逻辑

#### 本地数据库阶段

- [ ] 创建表结构定义
- [ ] 实现数据库迁移脚本
- [ ] 实现本地数据库服务
- [ ] 测试数据持久化和查询性能

#### 生产环境数据库阶段

- [ ] 配置云端数据库服务
- [ ] 实现数据同步策略
- [ ] 测试多用户并发访问
- [ ] 优化性能和安全性

## 3. 代码规范

所有开发工作必须遵循[编码规范与最佳实践](./templates/coding-standards.md)文档中的规则，确保代码质量和一致性。主要包括：

- 文件和目录命名规范
- TypeScript类型定义规范
- React/Next.js组件开发规范
- 移动端开发规范
- 国际化规范
- 测试规范
- 性能优化规范
- 安全规范

## 4. 目录结构

项目遵循以下目录结构，开发新功能时应按照此结构组织代码：

```
nextjs15-tailwind-ionic-capacitor-starter/
├── app/                      # Next.js App Router
│   ├── mobile/             # 移动端专属路由
│   ├── (web)/                # Web专属路由
│   └── api/                  # API路由
├── src/
│   ├── assets/               # 静态资源
│   │   ├── locales/          # 国际化资源文件
│   │   └── images/           # 图片资源
│   ├── core/                 # 跨平台核心
│   │   ├── components/       # 共享UI组件
│   │   ├── hooks/            # 共享Hooks
│   │   ├── lib/              # 核心库
│   │   │   ├── db/           # 数据库访问层
│   │   │   ├── i18n/         # 国际化核心
│   │   │   └── api/          # API客户端
│   │   ├── models/           # 数据模型
│   │   ├── services/         # 核心服务
│   │   ├── config/           # 核心配置
│   │   └── test/             # 核心测试
│   ├── mobile/               # 移动端特定
│   │   ├── components/       # 原生增强组件
│   │   ├── plugins/          # Capacitor插件封装
│   │   └── utils/            # 移动端工具
│   ├── web/                  # Web特定
│   ├── providers/            # 全局Providers
│   ├── styles/               # 全局样式
│   └── utils/                # 通用工具
├── tools/                    # 开发工具脚本
│   ├── screenshot_utils.py   # 截图工具
│   ├── get_browser.py        # 浏览器自动化
│   ├── web_scraper.py        # 网页抓取
│   ├── search_engine.py      # 搜索引擎
│   └── llm_api.py           # LLM API集成
├── capacitor/                # 原生项目
│   ├── android/              # Android平台
│   └── ios/                  # iOS平台
├── scripts/                  # 构建/部署脚本
├── docs/                     # 项目文档
│   ├── tasks/                # 任务计划和自动化脚本
│   │   ├── *.md              # 任务计划文档
│   │   └── *.sh              # 自动化脚本
│   └── templates/            # 文档模板
├── public/                   # 公共资源
└── test/                     # 测试代码
```

## 5. 开发工作流程检查清单

### 5.1 功能开发前

- [ ] 创建功能任务计划文档
- [ ] 完成任务拆解
- [ ] 确定技术方案
- [ ] 评估开发周期

### 5.2 开发过程中

- [ ] 遵循编码规范
- [ ] 定期更新任务进度
- [ ] 记录遇到的问题
- [ ] 编写单元测试

### 5.3 数据库开发

- [ ] 创建Mock数据
- [ ] 设计本地数据库结构
- [ ] 设计生产环境数据库结构
- [ ] 实现数据同步策略（如需要）

### 5.4 开发完成后

- [ ] 完成所有单元测试
- [ ] 更新相关文档
- [ ] 进行代码审查
- [ ] 准备发布计划

## 6. 文档更新规范

项目文档应保持最新，确保反映当前项目状态：

1. 功能开发完成后，更新相关文档
2. 修改API或数据结构时，更新对应文档
3. 发现文档错误时，及时修正
4. 定期审查文档，确保内容准确性

temp_mobile_standards.md
## 7. 移动端开发规范

### 7.1 路由结构
- 所有移动端路由必须放在`app/mobile`目录下
- 共享组件放在`src/core/components/`
- 移动端专属组件放在`src/mobile/components/`

### 7.2 插件封装
- 每个Capacitor插件应有对应的服务封装类
- 必须实现Web环境降级方案
## 7. UI素材管理流程

在开发过程中，当UI设计稿中包含图标、图片等素材，但这些素材尚未最终确定或提供时，应遵循以下流程：

### 7.1 素材需求记录

1. 在`docs/assets/assets-inventory.csv`文件中记录所有素材需求：
   - 为每个素材分配唯一文件名
   - 指定素材类型、尺寸、格式等信息
   - 添加用于生成素材的Midjourney提示词

2. 素材分类与优先级：
   - 按功能重要性划分优先级（P0/P1/P2）
   - 按类型分类：图标、插图、照片、动画

### 7.2 临时SVG替代方案

当设计素材尚未提供时：

1. 创建临时SVG文件：
   - 使用简单几何形状表示图标/图片功能
   - 存放在`src/assets/images/temp/`目录
   - 文件名添加`-temp`后缀

2. 在代码中使用临时SVG：
   - 通过React组件封装使用
   - 添加注释标明这是临时素材

### 7.3 素材更新流程

1. 使用CSV文件中的提示词通过Midjourney生成真实素材
2. 处理生成的素材（调整尺寸、格式转换等）
3. 替换临时SVG，更新代码引用
4. 更新CSV文件中的素材状态为"final"

详细指南请参考[UI素材管理指南](./templates/ui-assets-management.md)文档。

## 8. 常见问题与解决方案

本节将收集开发过程中遇到的常见问题及其解决方案，作为团队知识库：

| 问题类别 | 问题描述 | 解决方案 |
|---------|---------|----------|
| 环境配置 | 待添加 | 待添加 |
| 数据库 | Firebase初始化错误 | 1. 检查环境变量配置<br>2. 确保服务实现了优雅降级策略<br>3. 参考[数据库初始化与降级策略](./lessons/database/firebase-initialization-fallback.md) |
| 数据库 | 环境切换后数据丢失 | 1. 使用`--env-file`参数指定正确的环境文件<br>2. 确保数据同步服务正常工作<br>3. 检查数据库连接配置 |
| 移动端 | 待添加 | 待添加 |
| 国际化 | 待添加 | 待添加 |
| UI素材 | SVG在不同平台显示不一致 | 使用基本SVG元素，避免高级特性，确保viewBox设置正确 |

## 9. 常用插件集成与使用指南

本节提供了项目中常用的Capacitor插件集成和使用指南，帮助开发者快速实现移动端原生功能。

### 9.1 蓝牙LE插件

#### 9.1.1 安装与配置

1. **安装插件**：
   ```bash
   bun install @capacitor-community/bluetooth-le
   npx cap sync
   ```

2. **平台配置**：

   **Android (AndroidManifest.xml)**：
   ```xml
   <!-- 添加权限 -->
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" android:maxSdkVersion="30" />
   ```

   **iOS (Info.plist)**：
   ```xml
   <!-- 添加权限描述 -->
   <key>NSBluetoothAlwaysUsageDescription</key>
   <string>需要使用蓝牙来连接设备</string>
   <key>NSBluetoothPeripheralUsageDescription</key>
   <string>需要使用蓝牙来连接设备</string>
   ```

#### 9.1.2 使用示例

1. **创建蓝牙服务封装**：
   ```typescript
   // src/mobile/plugins/bluetooth/bluetooth-service.ts
   import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
   import { isPlatform } from '@ionic/react';

   export class BluetoothService {
     private static instance: BluetoothService;
     private initialized = false;

     private constructor() {}

     public static getInstance(): BluetoothService {
       if (!BluetoothService.instance) {
         BluetoothService.instance = new BluetoothService();
       }
       return BluetoothService.instance;
     }

     async initialize(): Promise<void> {
       if (this.initialized || !isPlatform('capacitor')) return;
       
       try {
         await BleClient.initialize();
         this.initialized = true;
       } catch (error) {
         console.error('蓝牙初始化失败:', error);
         throw error;
       }
     }

     async scanForDevices(serviceUUIDs?: string[]): Promise<BleDevice[]> {
       await this.initialize();
       const devices: BleDevice[] = [];
       
       await BleClient.requestLEScan(
         { services: serviceUUIDs },
         (result) => {
           const deviceIndex = devices.findIndex(d => d.deviceId === result.device.deviceId);
           if (deviceIndex < 0) {
             devices.push(result.device);
           }
         }
       );
       
       // 扫描5秒后停止
       setTimeout(async () => {
         await BleClient.stopLEScan();
       }, 5000);
       
       return devices;
     }

     async connect(deviceId: string): Promise<void> {
       await this.initialize();
       await BleClient.connect(deviceId);
     }

     async disconnect(deviceId: string): Promise<void> {
       await BleClient.disconnect(deviceId);
     }

     async read(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<DataView> {
       return await BleClient.read(deviceId, serviceUUID, characteristicUUID);
     }

     async write(deviceId: string, serviceUUID: string, characteristicUUID: string, data: DataView): Promise<void> {
       await BleClient.write(deviceId, serviceUUID, characteristicUUID, data);
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import React, { useState, useEffect } from 'react';
   import { BluetoothService } from '@/mobile/plugins/bluetooth/bluetooth-service';
   import { BleDevice } from '@capacitor-community/bluetooth-le';
   import { isPlatform, IonButton, IonList, IonItem, IonLabel } from '@ionic/react';

   const BluetoothDemo: React.FC = () => {
     const [devices, setDevices] = useState<BleDevice[]>([]);
     const [scanning, setScanning] = useState(false);
     const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
     
     const bluetoothService = BluetoothService.getInstance();
     
     const startScan = async () => {
       if (!isPlatform('capacitor')) {
         console.log('蓝牙功能仅在原生应用中可用');
         return;
       }
       
       try {
         setScanning(true);
         setDevices([]);
         const foundDevices = await bluetoothService.scanForDevices();
         setDevices(foundDevices);
       } catch (error) {
         console.error('扫描设备失败:', error);
       } finally {
         setScanning(false);
       }
     };
     
     const connectToDevice = async (deviceId: string) => {
       try {
         await bluetoothService.connect(deviceId);
         setConnectedDevice(deviceId);
       } catch (error) {
         console.error('连接设备失败:', error);
       }
     };
     
     const disconnectDevice = async () => {
       if (connectedDevice) {
         try {
           await bluetoothService.disconnect(connectedDevice);
           setConnectedDevice(null);
         } catch (error) {
           console.error('断开连接失败:', error);
         }
       }
     };
     
     return (
       <div>
         <IonButton onClick={startScan} disabled={scanning}>
           {scanning ? '扫描中...' : '扫描设备'}
         </IonButton>
         
         <IonList>
           {devices.map((device) => (
             <IonItem key={device.deviceId} onClick={() => connectToDevice(device.deviceId)}>
               <IonLabel>
                 <h2>{device.name || '未命名设备'}</h2>
                 <p>{device.deviceId}</p>
               </IonLabel>
             </IonItem>
           ))}
         </IonList>
         
         {connectedDevice && (
           <IonButton onClick={disconnectDevice}>断开连接</IonButton>
         )}
       </div>
     );
   };

   export default BluetoothDemo;
   ```

### 9.2 SQLite插件

#### 9.2.1 安装与配置

1. **安装插件**：
   ```bash
   bun install @capacitor-community/sqlite
   npx cap sync
   ```

2. **Web平台支持**：
   ```bash
   bun install jeep-sqlite sql.js
   ```
   
   并在`public`目录下创建`sql-wasm.wasm`文件。

#### 9.2.2 使用示例

1. **创建SQLite服务封装**：
   ```typescript
   // src/mobile/plugins/sqlite/sqlite-service.ts
   import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
   import { isPlatform } from '@ionic/react';

   export class SQLiteService {
     private static instance: SQLiteService;
     private sqlite: SQLiteConnection;
     private db: SQLiteDBConnection | null = null;
     private dbName = 'app_database';
     private initialized = false;

     private constructor() {
       this.sqlite = new SQLiteConnection(CapacitorSQLite);
     }

     public static getInstance(): SQLiteService {
       if (!SQLiteService.instance) {
         SQLiteService.instance = new SQLiteService();
       }
       return SQLiteService.instance;
     }

     async initialize(): Promise<void> {
       if (this.initialized) return;
       
       if (isPlatform('web')) {
         // Web平台初始化
         await this.sqlite.initWebStore();
       }
       
       const ret = await this.sqlite.checkConnectionsConsistency();
       const isConn = await this.sqlite.isConnection(this.dbName);
       
       if (ret.result && isConn.result) {
         this.db = await this.sqlite.retrieveConnection(this.dbName);
       } else {
         this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1);
       }
       
       await this.db.open();
       this.initialized = true;
     }

     async executeQuery(query: string, params: any[] = []): Promise<any> {
       if (!this.initialized) await this.initialize();
       if (!this.db) throw new Error('数据库未初始化');
       
       return await this.db.query(query, params);
     }

     async executeSet(set: { statement: string; values: any[] }[]): Promise<any> {
       if (!this.initialized) await this.initialize();
       if (!this.db) throw new Error('数据库未初始化');
       
       return await this.db.executeSet(set);
     }

     async createTable(tableName: string, columns: string[]): Promise<void> {
       const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`;
       await this.executeQuery(query);
     }

     async close(): Promise<void> {
       if (this.db) {
         await this.sqlite.closeConnection(this.dbName);
         this.db = null;
         this.initialized = false;
       }
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import React, { useEffect, useState } from 'react';
   import { SQLiteService } from '@/mobile/plugins/sqlite/sqlite-service';
   import { IonButton, IonInput, IonItem, IonLabel, IonList } from '@ionic/react';

   interface Todo {
     id: number;
     task: string;
     completed: boolean;
   }

   const SQLiteDemo: React.FC = () => {
     const [todos, setTodos] = useState<Todo[]>([]);
     const [newTask, setNewTask] = useState('');
     const sqliteService = SQLiteService.getInstance();
     
     useEffect(() => {
       const initDatabase = async () => {
         try {
           await sqliteService.initialize();
           await sqliteService.createTable('todos', [
             'id INTEGER PRIMARY KEY AUTOINCREMENT',
             'task TEXT NOT NULL',
             'completed INTEGER DEFAULT 0'
           ]);
           await loadTodos();
         } catch (error) {
           console.error('初始化数据库失败:', error);
         }
       };
       
       initDatabase();
       
       return () => {
         sqliteService.close();
       };
     }, []);
     
     const loadTodos = async () => {
       const result = await sqliteService.executeQuery('SELECT * FROM todos');
       setTodos(result.values || []);
     };
     
     const addTodo = async () => {
       if (!newTask.trim()) return;
       
       await sqliteService.executeQuery('INSERT INTO todos (task) VALUES (?)', [newTask]);
       setNewTask('');
       await loadTodos();
     };
     
     const toggleTodo = async (id: number, completed: boolean) => {
       await sqliteService.executeQuery(
         'UPDATE todos SET completed = ? WHERE id = ?',
         [completed ? 0 : 1, id]
       );
       await loadTodos();
     };
     
     const deleteTodo = async (id: number) => {
       await sqliteService.executeQuery('DELETE FROM todos WHERE id = ?', [id]);
       await loadTodos();
     };
     
     return (
       <div>
         <h2>SQLite 待办事项</h2>
         
         <IonItem>
           <IonLabel position="floating">新任务</IonLabel>
           <IonInput
             value={newTask}
             onIonChange={(e) => setNewTask(e.detail.value || '')}
           />
         </IonItem>
         
         <IonButton expand="block" onClick={addTodo}>添加任务</IonButton>
         
         <IonList>
           {todos.map((todo) => (
             <IonItem key={todo.id}>
               <IonLabel
                 onClick={() => toggleTodo(todo.id, !!todo.completed)}
                 style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
               >
                 {todo.task}
               </IonLabel>
               <IonButton slot="end" color="danger" onClick={() => deleteTodo(todo.id)}>删除</IonButton>
             </IonItem>
           ))}
         </IonList>
       </div>
     );
   };

   export default SQLiteDemo;
   ```

### 9.3 社交登录插件

#### 9.3.1 安装与配置

1. **安装插件**：
   ```bash
   bun install @capacitor-community/oauth2
   npx cap sync
   ```

2. **平台配置**：

   **Android (AndroidManifest.xml)**：
   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="@string/custom_url_scheme" />
   </intent-filter>
   ```

   **iOS (Info.plist)**：
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>your-custom-scheme</string>
       </array>
     </dict>
   </array>
   ```

#### 9.3.2 使用示例

1. **创建OAuth服务封装**：
   ```typescript
   // src/mobile/plugins/oauth/oauth-service.ts
   import { OAuth2Client, OAuth2AuthorizationResponse } from '@capacitor-community/oauth2';

   export interface OAuthConfig {
     authorizationBaseUrl: string;
     accessTokenEndpoint: string;
     clientId: string;
     redirectUrl: string;
     scope: string;
     responseType: string;
     pkceEnabled?: boolean;
     additionalParameters?: Record<string, string>;
   }

   export class OAuthService {
     private static instance: OAuthService;
     private configs: Record<string, OAuthConfig> = {};

     private constructor() {
       // 预设常用OAuth配置
       this.configs = {
         google: {
           authorizationBaseUrl: 'https://accounts.google.com/o/oauth2/auth',
           accessTokenEndpoint: 'https://oauth2.googleapis.com/token',
           clientId: 'YOUR_GOOGLE_CLIENT_ID',
           redirectUrl: 'com.example.app:/oauth2redirect',
           scope: 'email profile',
           responseType: 'code',
           pkceEnabled: true
         },
         github: {
           authorizationBaseUrl: 'https://github.com/login/oauth/authorize',
           accessTokenEndpoint: 'https://github.com/login/oauth/access_token',
           clientId: 'YOUR_GITHUB_CLIENT_ID',
           redirectUrl: 'com.example.app:/oauth2redirect',
           scope: 'user',
           responseType: 'code'
         },
         wechat: {
           authorizationBaseUrl: 'https://open.weixin.qq.com/connect/oauth2/authorize',
           accessTokenEndpoint: 'https://api.weixin.qq.com/sns/oauth2/access_token',
           clientId: 'YOUR_WECHAT_APP_ID',
           redirectUrl: 'com.example.app:/oauth2redirect',
           scope: 'snsapi_userinfo',
           responseType: 'code',
           additionalParameters: {
             appid: 'YOUR_WECHAT_APP_ID'
           }
         }
       };
     }

     public static getInstance(): OAuthService {
       if (!OAuthService.instance) {
         OAuthService.instance = new OAuthService();
       }
       return OAuthService.instance;
     }

     setConfig(provider: string, config: OAuthConfig): void {
       this.configs[provider] = config;
     }

     async login(provider: string): Promise<OAuth2AuthorizationResponse> {
       const config = this.configs[provider];
       if (!config) {
         throw new Error(`未找到 ${provider} 的OAuth配置`);
       }

       return await OAuth2Client.authenticate(config);
     }

     async logout(provider: string): Promise<void> {
       // 对于大多数OAuth提供商，客户端注销只需清除本地令牌
       // 某些提供商可能需要调用特定的注销端点
       console.log(`从 ${provider} 注销`);
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import React, { useState } from 'react';
   import { OAuthService } from '@/mobile/plugins/oauth/oauth-service';
   import { IonButton, IonContent, IonPage, IonText } from '@ionic/react';

   const OAuthDemo: React.FC = () => {
     const [authResponse, setAuthResponse] = useState<any>(null);
     const [error, setError] = useState<string>('');
     const oauthService = OAuthService.getInstance();
     
     const loginWithGoogle = async () => {
       try {
         setError('');
         const response = await oauthService.login('google');
         setAuthResponse(response);
         console.log('Google登录成功:', response);
       } catch (err) {
         console.error('Google登录失败:', err);
         setError('登录失败: ' + (err instanceof Error ? err.message : String(err)));
       }
     };
     
     const loginWithGitHub = async () => {
       try {
         setError('');
         const response = await oauthService.login('github');
         setAuthResponse(response);
         console.log('GitHub登录成功:', response);
       } catch (err) {
         console.error('GitHub登录失败:', err);
         setError('登录失败: ' + (err instanceof Error ? err.message : String(err)));
       }
     };
     
     const loginWithWeChat = async () => {
       try {
         setError('');
         const response = await oauthService.login('wechat');
         setAuthResponse(response);
         console.log('微信登录成功:', response);
       } catch (err) {
         console.error('微信登录失败:', err);
         setError('登录失败: ' + (err instanceof Error ? err.message : String(err)));
       }
     };
     
     const logout = async () => {
       if (authResponse) {
         // 假设我们知道当前登录的提供商
         await oauthService.logout('google'); // 或其他提供商
         setAuthResponse(null);
       }
     };
     
     return (
       <IonPage>
         <IonContent>
           <div style={{ padding: '20px' }}>
             <h2>社交登录演示</h2>
             
             {!authResponse ? (
               <div>
                 <IonButton expand="block" onClick={loginWithGoogle}>使用Google登录</IonButton>
                 <IonButton expand="block" onClick={loginWithGitHub}>使用GitHub登录</IonButton>
                 <IonButton expand="block" onClick={loginWithWeChat}>使用微信登录</IonButton>
               </div>
             ) : (
               <div>
                 <h3>登录成功</h3>
                 <pre>{JSON.stringify(authResponse, null, 2)}</pre>
                 <IonButton expand="block" onClick={logout}>退出登录</IonButton>
               </div>
             )}
             
             {error && (
               <IonText color="danger">
                 <p>{error}</p>
               </IonText>
             )}
           </div>
         </IonContent>
       </IonPage>
     );
   };

   export default OAuthDemo;
   ```

### 9.4 插件集成最佳实践

1. **插件封装原则**：
   - 始终使用单例模式封装插件服务
   - 提供统一的错误处理机制
   - 添加平台检测，确保在Web环境中优雅降级
   - 延迟初始化，仅在需要时初始化插件

2. **权限处理**：
   - 在使用需要权限的插件前，先检查并请求权限
   - 提供用户友好的权限请求说明
   - 处理权限被拒绝的情况

3. **错误处理**：
   - 捕获并记录所有插件操作中的错误
   - 为用户提供有意义的错误消息
   - 实现重试机制处理临时性错误

4. **性能优化**：
   - 避免频繁初始化和释放插件资源
   - 实现资源池管理长期连接（如蓝牙、数据库连接）
   - 使用防抖和节流技术限制高频操作

5. **测试策略**：
   - 为每个插件封装编写单元测试
   - 创建模拟实现用于Web环境测试
   - 使用设备模拟器进行集成测试

## 10. 资源与参考

- [Next.js 官方文档](https://nextjs.org/docs)
- [Ionic Framework 文档](https://ionicframework.com/docs)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
