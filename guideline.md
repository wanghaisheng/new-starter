# Capacitor-Next.js 15 + Ionic + Tailwind 全栈启动项目完整规则集

## 1. 项目初始化与环境设置

### 1.1 环境检查

在首次克隆项目或未确认项目初始化状态时，必须运行环境检查脚本：

```bash
bash docs/tasks/tools/check-environment.sh
```

如果检查发现问题，请按照脚本输出的建议进行修复。详细的初始化指南请参考 ](./docs/project-initialization-guide.md)。

脚本会在环境检查通过后创建初始化完成标记（`.env.local` 文件中的 `NEXT_PUBLIC_ENV_INITIALIZED=true`），后续开发无需再次运行环境检查。

如果需要强制重新检查环境，可以使用 `--force` 参数：

```bash
bash docs/tasks/tools/check-environment.sh --force
```

### 1.2 项目结构

项目必须遵循以下目录结构：

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

### 1.3 导入路径规范

#### 1.3.1 路径别名

项目使用以下路径别名，必须优先使用这些别名而不是相对路径：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@mobile/*": ["./src/mobile/*"],
      "@web/*": ["./src/web/*"]
    }
  }
}
```

#### 1.3.2 导入规则

1. **优先使用路径别名**：
   ```typescript
   // ✅ 正确
   import { User } from '@/core/types';
   import { Button } from '@core/components';
   
   // ❌ 错误
   import { User } from '../../../core/types';
   import { Button } from '../../components';
   ```

2. **按模块组织导入**：
   ```typescript
   // ✅ 正确
   // 第三方库导入
   import { useState, useEffect } from 'react';
   import { Capacitor } from '@capacitor/core';
   
   // 项目内部导入
   import { User } from '@/core/types';
   import { Button } from '@core/components';
   ```

3. **类型导入**：
   ```typescript
   // ✅ 正确
   import type { User } from '@/core/types';
   
   // ❌ 错误
   import { User } from '@/core/types';
   ```

4. **测试文件导入**：
   ```typescript
   // ✅ 正确
   import { mockIndexedDB } from '@/core/test/mock-indexeddb';
   import { User } from '@/core/types';
   
   // ❌ 错误
   import { mockIndexedDB } from '../../../../test/mock-indexeddb';
   import { User } from '../../../../types';
   ```

5. **样式导入**：
   ```typescript
   // ✅ 正确
   import '@/styles/global.css';
   
   // ❌ 错误
   import '../../styles/global.css';
   ```

#### 1.3.3 导入顺序

1. 第三方库导入
2. 项目内部类型导入
3. 项目内部组件导入
4. 项目内部工具函数导入
5. 样式导入

示例：
```typescript
// 1. 第三方库
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// 2. 类型导入
import type { User, Match } from '@/core/types';

// 3. 组件导入
import { Button } from '@core/components';
import { UserCard } from '@mobile/components';

// 4. 工具函数
import { formatDate } from '@/utils/date';

// 5. 样式
import '@/styles/global.css';
```

### 1.4 自动化脚本

项目提供以下自动化脚本，用于简化环境设置和开发流程：

1. `docs/tasks/tools/check-environment.sh` - 环境检查脚本
2. `docs/tasks/tools/init-project.sh` - 项目初始化脚本
3. `docs/tasks/tools/init-git-repo.sh` - Git 仓库初始化脚本
4. `docs/tasks/tools/install-dependencies.sh` - 依赖安装脚本
5. `docs/tasks/tools/commit-code.sh` - 代码提交脚本

## 2. 开发规范

### 2.1 代码风格

所有代码必须遵循项目的 ESLint 和 Prettier 配置，确保代码风格一致。

### 2.2 组件开发

1. 组件应遵循单一职责原则
2. 共享组件放在 `src/core/components` 目录
3. 平台特定组件分别放在 `src/mobile/components` 和 `src/web/components` 目录
4. 组件应使用 TypeScript 类型定义 props

### 2.3 数据模型

1. 所有数据模型定义放在 `src/core/models` 目录
2. 使用 TypeScript 接口定义数据结构
3. 模型应包含必要的注释说明字段用途
4. 遵循数据库演进策略：
   - Mock数据阶段：使用内存数据结构
   - 本地数据库阶段：实现本地持久化
   - 生产环境阶段：支持云端和离线存储

### 2.4 数据库架构与实现指南

#### 2.4.1 架构概述

项目采用分层架构，支持多环境数据存储和同步，所有类型统一出口，底层实现高内聚、强解耦：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现（底层连接与原生 API 封装）
│   ├── capacitor-sqlite/  # 移动端 SQLite 封装
│   ├── indexeddb/        # Web 端 IndexedDB 封装
│   ├── mock/             # Mock 环境实现
│   └── base-client.ts    # 客户端抽象基类
├── repositories/     # 数据访问层，聚合/复用 clients，实现业务数据访问
│   ├── adapters/     # 各数据源适配器，命名唯一明确
│   ├── registry/     # 仓储注册表，集中管理所有实例
│   └── factory/      # 工厂方法，自动注入 client 并注册
├── schema/           # 数据模型定义
└── types/            # 类型定义，唯一类型出口和入口
```

> **架构原则：**
> - clients/ 仅封装原生连接与基础操作，不含业务逻辑。
> - repositories/ 负责业务相关的数据访问逻辑，adapter 命名必须唯一且直接反映底层实现类型（禁止 local/cloud 等模糊命名）。
> - types/ 目录为唯一类型出口，所有类型定义与导出均通过 types/index.ts。
> - 数据服务聚合层已迁移至 db 目录外，db 仅聚焦底层存储与类型。

#### 2.4.2 存储类型与配置

- 所有数据库类型通过 `types/.ts` 中常量统一管理。
- 支持 memory、indexeddb、sqlite、supabase、firebase 等多种类型，环境变量动态切换。
- 离线/在线类型分别受 SUPPORTED_STORAGE_TYPES、SUPPORTED_OFFLINE_STORAGE_TYPES 控制。
- 配置加载与校验由 config-loader.ts 统一实现。

#### 2.4.3 仓储适配器命名规范（重要！）

- adapter 文件名和类名必须唯一且无歧义，直接反映其数据源/实现类型：
  - ✅ `user-repository-mock.ts` / `UserRepositoryMock`
  - ✅ `user-repository-indexeddb.ts` / `UserRepositoryIndexedDB`
  - ✅ `user-repository-sqlite.ts` / `UserRepositorySQLite`
  - ✅ `user-repository-supabase.ts` / `UserRepositorySupabase`
  - ✅ `user-repository-firebase.ts` / `UserRepositoryFirebase`
  - ✅ `user-repository-hybrid.ts` / `UserRepositoryHybrid`
- 禁止使用"local"、"cloud"等模糊命名！
- 适配器均实现统一接口 `IBaseRepository<T>`，通过依赖注入持有 client。

#### 2.4.4 工厂/注册表自动选择策略

- 工厂/注册表根据 ENV_STAGE、DATA_MODE、providerType 自动选择和注册对应实现。
- 业务层/页面/服务 hooks 只通过注册表获取仓储实例，禁止直连工厂或具体实现。

**选择示例：**

```typescript
import { UserRepositoryMock } from './repositories/adapters/user-repository-mock';
import { UserRepositoryIndexedDB } from './repositories/adapters/user-repository-indexeddb';
import { UserRepositorySupabase } from './repositories/adapters/user-repository-supabase';
import { RepositoryRegistry } from './repositories/registry';

const envStage = process.env.ENV_STAGE;
const dataMode = process.env.DATA_MODE;

let userRepo;
if (envStage === 'mock') {
  userRepo = new UserRepositoryMock();
} else if (envStage === 'local' && dataMode === 'offline-only') {
  userRepo = new UserRepositoryIndexedDB(/* IndexedDBClient */);
} else if (dataMode === 'online-only') {
  userRepo = new UserRepositorySupabase(/* SupabaseClient */);
} else if (dataMode === 'hybrid') {
  // TODO: 实现 hybrid adapter
  // userRepo = new UserRepositoryHybrid(...);
  userRepo = new UserRepositorySupabase(/* fallback */);
} else {
  userRepo = new UserRepositoryMock();
}
RepositoryRegistry.register('user', userRepo);
```

#### 2.4.5 类型统一出口和入口

- 所有数据库相关类型（如 StorageType、DatabaseConfig、实体类型等）都在 `types/` 目录集中定义与导出，唯一入口为 `types/index.ts`。
- 保证全局类型一致性，避免命名冲突，便于 IDE 智能提示和维护。

#### 2.4.6 平台特定实现（离线/在线存储分离）

##### 2.4.6.1 离线存储（本地优先，断网可用）
- Web 平台：优先 IndexedDB 适配器（如 user-repository-indexeddb.ts）
- 移动端：优先 SQLite 适配器（如 user-repository-sqlite.ts）
- mock 环境：优先内存 mock 适配器（如 user-repository-mock.ts）
- 离线存储适配器需保证断网时可用、支持本地事务、后续可与云端同步

##### 2.4.6.2 在线存储（云端为主，需联网）
- 推荐 Supabase、Firebase、Postgres 等云端适配器（如 user-repository-supabase.ts、user-repository-firebase.ts）
- 生产/开发环境优先云端适配器，保证数据一致性、实时性和备份能力
- 在线存储适配器需支持多端同步、权限控制、云端事务等

##### 2.4.6.3 混合/同步模式
- hybrid 适配器（如 user-repository-hybrid.ts）支持本地与云端自动同步/切换，兼顾离线可用与云端一致性

#### 2.4.7 数据库开发流程

数据库开发遵循渐进式流程，从Mock数据到生产环境数据库。这三个阶段构成了一个连续的开发流程，理想情况下，只需通过切换环境变量即可在不同阶段间无缝切换，而无需修改业务代码。

| 阶段 | 环境变量 | 主要目的 | 关注点 |
|------|---------|---------|--------|
| Mock数据 | NEXT_PUBLIC_DATABASE_ENV=mock | 需求确认与快速原型 | 数据结构、字段定义、关联关系 |
| 本地数据库 | NEXT_PUBLIC_DATABASE_ENV=local | 功能验证与性能测试 | 数据持久化、查询性能、事务处理 |
| 生产环境 | NEXT_PUBLIC_DATABASE_ENV=production | 正式部署与多用户支持 | 安全性、可扩展性、数据同步 |

1. **Mock数据阶段**
   - 在src/mock/data/目录下创建JSON格式的模拟数据
   - 实现Mock数据服务，提供与真实服务相同的接口
   - 在.env.development中配置使用Mock数据
   - 验证UI和业务逻辑
   - **重要**：确保服务实现中包含适当的降级策略

2. **本地数据库阶段**
   - 设计数据库Schema，确保与Mock数据结构一致
   - 创建数据库迁移脚本
   - 实现本地数据库服务（与Mock服务保持相同接口）
   - 在.env.local中配置使用本地数据库
   - 验证数据持久化和查询性能

3. **生产环境阶段**
   - 云端数据库：
     - 选择云端数据库服务（Firebase/Supabase/Cloudflare D1）
     - 实现云端数据库服务（与前两个阶段保持相同接口）
     - 配置云端数据库连接
   - 离线存储：
     - 移动端：使用Capacitor SQLite
     - Web端：使用IndexedDB/LocalStorage
     - 实现数据同步机制
   - 数据同步：
     - 实现云端和本地数据同步
     - 处理数据冲突
     - 优化同步性能

4. **环境切换**
   ```bash
   # 开发环境（Mock数据）
   bun run dev
   
   # 本地数据库环境
   bun run dev --env-file=.env.local
   
   # 生产环境
   bun run build
   bun run start
   ```

5. **数据库工厂**
   - 实现统一的数据库客户端工厂
   - 根据环境和平台选择合适的存储方案
   - 提供一致的数据库操作接口
   - 实现优雅降级策略，确保配置不完整时能回退到基础功能

6. **测试要求**
   - 编写单元测试覆盖数据库操作
   - 实现集成测试验证数据同步
   - 进行性能测试确保响应时间

7. **安全考虑**
   - 加密敏感数据
   - 实现访问控制
   - 定期数据备份
   - 监控异常访问

详细流程请参考[数据库开发工作流程](./docs/templates/database-development-workflow.md)文档。更多数据库架构与实现细节可查阅[数据库架构文档](./docs/guides/architecture/database/README.md)。

### 2.5 API 调用

1. API 客户端封装在 `src/core/lib/api` 目录
2. 使用 Axios 或 Fetch API 进行网络请求
3. 所有 API 调用应处理错误情况

### 2.6 移动端插件

1. Capacitor 插件封装在 `src/mobile/plugins` 目录
2. 插件服务应提供平台检测和错误处理
3. 插件使用单例模式实现

## 3. 版本控制

### 3.1 Git 分支管理

项目采用 [Git 分支管理策略](./docs/git-branch-strategy.md)，主要包括：

1. `main` 分支：生产环境代码
2. `develop` 分支：开发环境代码
3. `feature/*` 分支：新功能开发
4. `bugfix/*` 分支：bug 修复
5. `release/*` 分支：版本发布准备

### 3.2 提交信息规范

提交信息必须遵循以下格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）包括：
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码风格调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

## 4. 文档规范

### 4.1 任务计划文档

所有功能开发必须先创建任务计划文档，放在 `docs/tasks` 目录，使用 [功能任务计划模板](./docs/templates/feature-task-plan-template.md)。

### 4.2 代码注释

1. 公共 API 和复杂逻辑必须添加注释
2. 使用 JSDoc 格式注释函数和类
3. TODO 注释必须包含 JIRA 任务 ID

### 4.3 README 文件

项目根目录必须包含 README.md 文件，说明项目概述、安装步骤和基本用法。

## 5. 测试规范

### 5.1 单元测试

1. 所有核心功能必须编写单元测试
2. 测试文件放在 `test` 目录，与源文件结构对应
3. 使用 Jest 作为测试框架

### 5.2 集成测试

1. 关键功能流程必须编写集成测试
2. 使用 Cypress 进行 E2E 测试

## 6. 国际化规范

### 6.1 翻译文件

1. 翻译文件放在 `src/assets/locales` 目录
2. 支持中文和英文两种语言
3. 使用 JSON 格式存储翻译键值对

### 6.2 翻译使用

1. 所有用户可见文本必须使用翻译函数
2. 翻译键应使用点号分隔的命名空间

## 7. 移动端适配

### 7.1 响应式设计

1. 使用 Tailwind CSS 的响应式类进行布局
2. 移动端优先的设计理念

### 7.2 原生功能

1. 相机、地理位置等原生功能通过 Capacitor 插件实现
2. 必须处理权限请求和拒绝的情况

## 8. 性能优化

### 8.1 代码分割

1. 使用动态导入进行代码分割
2. 路由级别的组件懒加载

### 8.2 资源优化

1. 图片使用适当的格式和大小
2. 使用 Next.js 的图片优化功能

## 9. 安全规范

### 9.1 数据安全

1. 敏感数据不得硬编码在源代码中
2. 使用环境变量存储 API 密钥等敏感信息

### 9.2 输入验证

1. 所有用户输入必须进行验证
2. 使用 Zod 或类似库进行数据验证

## 10. 部署规范

### 10.1 构建流程

1. 使用 `bun run build:static` 生成静态文件
2. 使用 `bun run cap:sync` 同步到原生项目

### 10.2 版本发布

1. 遵循语义化版本规范
2. 每次发布必须更新 CHANGELOG.md

## 1. Capacitor插件集成指南

### 1.1 核心必备插件
这些插件覆盖了大多数App的基础需求：

| **插件**                     | **功能**                     | **安装命令**                          |
|------------------------------|-----------------------------|---------------------------------------|
| **`@capacitor/app`**         | 管理App生命周期（前后台切换、退出等） | `bun install @capacitor/app`         |
| **`@capacitor/haptics`**     | 触觉反馈（振动）              | `bun install @capacitor/haptics`     |
| **`@capacitor/keyboard`**    | 键盘弹出/收起事件监听         | `bun install @capacitor/keyboard`    |
| **`@capacitor/status-bar`**  | 状态栏颜色和样式控制          | `bun install @capacitor/status-bar`  |
| **`@capacitor/splash-screen`** | 启动页控制（隐藏、延迟等）    | `bun install @capacitor/splash-screen` |

### 1.2 设备功能插件
访问手机硬件或系统功能：

| **插件**                     | **功能**                     | **安装命令**                          |
|------------------------------|-----------------------------|---------------------------------------|
| **`@capacitor/camera`**      | 拍照或选择相册图片           | `bun install @capacitor/camera`      |
| **`@capacitor/geolocation`** | 获取GPS位置                | `bun install @capacitor/geolocation` |
| **`@capacitor/filesystem`**  | 本地文件读写（如缓存、下载）  | `bun install @capacitor/filesystem`  |
| **`@capacitor/preferences`** | 本地键值存储（类似localStorage） | `bun install @capacitor/preferences` |
| **`@capacitor/device`**      | 获取设备信息（型号、OS版本等） | `bun install @capacitor/device`      |

### 1.3 网络与通信插件

| **插件**                     | **功能**                     | **安装命令**                          |
|------------------------------|-----------------------------|---------------------------------------|
| **`@capacitor/network`**     | 检测网络状态（在线/离线）     | `bun install @capacitor/network`     |
| **`@capacitor/share`**       | 调用系统分享功能              | `bun install @capacitor/share`       |
| **`@capacitor/http`**        | 原生HTTP请求（绕过CORS）   | `bun install @capacitor/http`        |

### 1.4 高级功能插件
根据场景按需集成：

| **插件**                     | **功能**                     | **安装命令**                          |
|------------------------------|-----------------------------|---------------------------------------|
| **`@capacitor/push-notifications`** | 推送通知（需配置Firebase/APNs） | `bun install @capacitor/push-notifications` |
| **`@capacitor/local-notifications`** | 本地通知（无需服务器）       | `bun install @capacitor/local-notifications` |
| **`@capacitor/apple-login`**  | 苹果账号登录（Sign in with Apple） | `bun install @capacitor/apple-login` |
| **`@capacitor/google-auth`**  | Google登录                  | `bun install @capacitor/google-auth` |
| **`@capacitor/screen-reader`** | 屏幕阅读器（无障碍功能）      | `bun install @capacitor/screen-reader` |

### 1.5 支付与商业化插件

| **插件**                     | **功能**                     | **安装命令**                          |
|------------------------------|-----------------------------|---------------------------------------|
| **`capacitor-purchases`**    | 苹果内购/谷歌支付（RevenueCat封装） | `bun install @revenuecat/purchases-capacitor` |
| **`capacitor-stripe`**       | Stripe支付集成              | `bun install capacitor-stripe`       |

### 1.6 企业级插件

| **插件**                     | **功能**                     | **安装命令**                          |
|------------------------------|-----------------------------|---------------------------------------|
| **`@capacitor-community/sqlite`** | 本地SQLite数据库         | `bun install @capacitor-community/sqlite` |
| **`@capacitor-community/bluetooth-le`** | 蓝牙低功耗（BLE）通信 | `bun install @capacitor-community/bluetooth-le` |

### 1.7 插件使用示例

#### 相机插件示例
```typescript
import { Camera } from '@capacitor/camera';

const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    resultType: 'uri'
  });
  console.log('图片路径:', image.path);
};
```

#### 文件系统插件示例
```typescript
import { Filesystem } from '@capacitor/filesystem';

const writeFile = async () => {
  await Filesystem.writeFile({
    path: 'text.txt',
    data: 'Hello World',
    directory: Directory.Documents
  });
};
```

#### 网络状态检测示例
```typescript
import { Network } from '@capacitor/network';

const checkNetwork = async () => {
  const status = await Network.getStatus();
  console.log('网络状态:', status.connected ? '在线' : '离线');
};
```

### 1.8 插件集成注意事项

1. **平台兼容性**：部分插件仅支持iOS/Android（如`apple-login`），需检查文档。
2. **权限配置**：相机、GPS等功能需在`android/app/src/main/AndroidManifest.xml`和`ios/App/App/Info.plist`中声明权限。
3. **插件更新**：定期运行`npx cap update`同步原生代码。

### 1.9 iOS支付规则与合规指南

如果在App Store上架的iOS应用中同时集成了RevenueCat（苹果内购IAP）和Stripe（或其他第三方支付），存在被苹果下架的风险，但具体是否违规取决于支付的使用场景。

#### 1.9.1 苹果的明确规则
根据[App Store审核指南3.1.1](https://developer.apple.com/app-store/review/guidelines/#payments)：
- **虚拟商品/数字服务**（如会员订阅、游戏货币、解锁功能）必须使用**苹果内购（IAP）**，苹果抽成15%~30%。
- **实物商品/线下服务**（如电商商品、外卖、打车）允许使用第三方支付（如Stripe）。
- **违规后果**：苹果会拒绝审核或直接下架应用。

#### 1.9.2 允许同时集成的情况

**✅ 合规场景（不会被下架）**

| **支付方式**       | **用途**                                                                 | 示例                          |
|--------------------|-------------------------------------------------------------------------|-------------------------------|
| **RevenueCat（IAP）** | 销售虚拟商品/数字内容（如App内会员、游戏道具）。                       | 解锁高级功能、月度订阅。        |
| **Stripe**         | 销售实物商品或线下服务（需提供真实物流或服务凭证）。                     | 网购衣服、预约家政服务。        |

**❌ 违规场景（高风险下架）**

| **行为**                                                                 | 苹果的处罚依据                     |
|--------------------------------------------------------------------------|-----------------------------------|
| 用Stripe销售虚拟商品（绕过IAP）。                                      | 违反规则3.1.1。                  |
| 在App内引导用户到网页支付（如弹窗提示"官网购买更便宜

## 2. 项目结构与架构

### 增强型目录结构
```
capacitor-nextjs-ionic-starter/
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
├── public/                   # 公共资源
└── test/                     # 测试代码
```

## 2. 国际化(i18n)完整实现

### 国际化架构设计
```
src/core/lib/i18n/
├── config.ts              # i18n配置
├── dictionaries/          # 翻译字典
│   ├── en/
│   │   ├── common.json    # 通用文本
│   │   ├── auth.json      # 认证相关
│   │   └── ...           # 按模块组织
│   ├── zh/
│   └── ...
├── hooks/                 # 国际化Hooks
├── providers/             # 国际化Providers
└── types.ts               # 类型定义
```

### 核心实现代码

#### 配置与初始化
```typescript
// src/core/lib/i18n/config.ts
import { createI18n } from 'next-international'
import type Locales from './dictionaries'

export const {
  useI18n,
  useScopedI18n,
  I18nProvider,
  getStaticParams,
  useCurrentLocale,
  useChangeLocale
} = createI18n<typeof Locales>({
  // 默认从URL路径检测语言 (e.g. /en/about)
  resolveLocale: (locale) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('locale') || locale
    }
    return locale
  }
})
```

#### 字典示例
```json
// src/core/lib/i18n/dictionaries/en/common.json
{
  "welcome": "Welcome",
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel"
  }
}

// src/core/lib/i18n/dictionaries/zh/common.json
{
  "welcome": "欢迎",
  "buttons": {
    "submit": "提交",
    "cancel": "取消"
  }
}
```

#### 应用集成
```typescript
// src/providers/I18nProvider.tsx
'use client'

import { I18nProvider } from '@/core/lib/i18n/config'

export default function AppI18nProvider({
  children,
  locale
}: {
  children: React.ReactNode
  locale: string
}) {
  return <I18nProvider locale={locale}>{children}</I18nProvider>
}
```

#### 组件使用示例
```typescript
// src/core/components/Button.tsx
import { useI18n } from '@/core/lib/i18n/config'

export function SubmitButton() {
  const t = useI18n()
  return (
    <button className="btn-primary">
      {t('buttons.submit')}
    </button>
  )
}
```

### 数据国际化处理

#### 国际化字段模型
```typescript
// src/core/models/product.ts
export interface Product {
  id: string
  name: LocalizedString
  description: LocalizedString
  price: number
}

export type LocalizedString = {
  [locale: string]: string
} & { default: string }
```

#### 数据库处理
```typescript
// src/core/lib/db/interfaces.ts
export interface IDatabaseClient {
  // 获取本地化产品
  getLocalizedProducts(locale: string): Promise<Product[]>
  
  // 创建支持多语言的产品
  createProduct(product: {
    name: LocalizedString
    description: LocalizedString
    price: number
  }): Promise<Product>
}
```

## 3. 数据演进策略增强

### 环境变量配置
```ini
# .env.local
DB_ENGINE=sqlite # mock, indexeddb, sqlite, supabase, postgres, mysql, cloudflare-d1
MOCK_DB_TYPE=json # json, faker

# 本地数据库
SQLITE_ENCRYPTION_KEY= # 加密密钥
INDEXEDDB_NAME=app_db

# 云端数据库
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# 国际化
DEFAULT_LOCALE=en
SUPPORTED_LOCALES=en,zh,ja
```

### 数据库工厂增强
```typescript
// src/core/lib/db/factory.ts
import { Capacitor } from '@capacitor/core'

export function createDatabaseClient(engine: DatabaseEngine) {
  // 移动端优先使用SQLite
  if (Capacitor.isNativePlatform() && engine === 'indexeddb') {
    engine = 'sqlite'
  }

  switch (engine) {
    case 'mock':
      return new MockDatabaseClient(process.env.MOCK_DB_TYPE)
    case 'indexeddb':
      return new IndexedDBClient(process.env.INDEXEDDB_NAME)
    case 'sqlite':
      return new SQLiteClient({
        encryptionKey: process.env.SQLITE_ENCRYPTION_KEY
      })
    case 'supabase':
      return new SupabaseClient({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
      })
    // 其他数据库实现...
  }
}
```

### 数据预加载服务

为了优化移动应用性能和提供离线支持，项目实现了数据预加载服务，用于在应用启动或网络恢复时预先加载常用数据。

#### 预加载服务架构

```
src/core/services/data/preload/
├── data-preload-service.ts   # 预加载服务核心实现
├── types.ts                  # 类型定义
└── usage-example.ts          # 使用示例
```

#### 配置选项

```typescript
// 预加载配置示例
const preloadConfig: DataPreloadConfig = {
  enabled: true,                          // 是否启用预加载
  preloadTables: ['users', 'messages'],   // 需预加载的表（可使用字符串或配置对象）
  maxRecordsPerTable: 20,                 // 每个表最大预加载记录数
  autoPreloadInterval: 5 * 60 * 1000,     // 自动预加载间隔（毫秒）
  cacheTTL: 15 * 60 * 1000,               // 缓存过期时间（毫秒）
  maxCacheTables: 20,                     // 最大缓存表数量
  preloadOnNetworkReconnect: true,        // 网络恢复时是否自动预加载
  cacheKeyPrefix: 'preload_'              // 缓存键前缀
};
```

#### 高级表配置

```typescript
// 使用高级配置对象定义预加载表
const preloadConfig: DataPreloadConfig = {
  enabled: true,
  preloadTables: [
    'simple_table',                       // 简单字符串配置
    { 
      name: 'users',                      // 表名
      priority: 1,                        // 加载优先级（数字越小越优先）
      maxRecords: 50,                     // 表特定的最大记录数
      cacheTTL: 30 * 60 * 1000            // 表特定的缓存过期时间
    },
    { 
      name: 'messages', 
      priority: 2,                        // 优先级较低，会在users表之后加载
      maxRecords: 100
    }
  ],
  // 其他全局配置...
};
```

#### 使用示例

```typescript
// 初始化预加载服务
const hybrid = new HybridDatabaseClient({ /* 配置选项 */ });
const preloadService = DataPreloadService.getInstance(hybrid, preloadConfig);

// 手动触发预加载
preloadService.preloadAll();

// 获取预加载数据
const users = preloadService.getCachedData('users');

// 获取带状态的预加载结果
const result = preloadService.getPreloadResult('users');
console.log(result.status);  // 'idle' | 'preloading' | 'success' | 'error'
console.log(result.data);    // 预加载的数据
console.log(result.error);   // 如果有错误
console.log(result.updatedAt); // 上次更新时间戳

// 监听预加载事件
preloadService.on('preload:start', ({ table }) => {
  console.log(`开始预加载表: ${table}`);
});

preloadService.on('preload:success', ({ table, data }) => {
  console.log(`表 ${table} 预加载成功，获取到 ${data.length} 条记录`);
});

preloadService.on('network:online', () => {
  console.log('网络已恢复连接');
});
```

#### 网络感知与自动预加载

预加载服务集成了网络状态监控，可以在网络恢复时自动刷新数据：

```typescript
// 网络状态变化处理
preloadService.on('network:online', () => {
  // 网络恢复时的UI更新
  showToast('网络已连接');
});

preloadService.on('network:offline', () => {
  // 网络断开时的UI更新
  showToast('网络已断开，使用缓存数据');
});
```

#### 缓存管理

```typescript
// 清除特定表的缓存
preloadService.clearCache('users');

// 清除所有缓存
preloadService.clearCache();

// 刷新特定表的缓存
preloadService.refreshCache('users');

// 监听缓存过期事件
preloadService.on('cache:expired', ({ table, reason }) => {
  console.log(`表 ${table} 的缓存已过期，原因: ${reason || 'TTL到期'}`);
});
```

### 网络管理服务

项目实现了网络管理服务，用于监控网络状态变化并提供统一的网络状态API。该服务与数据预加载服务紧密集成，支持在网络恢复时自动刷新数据。

#### 网络管理服务架构

```
src/core/services/infrastructure/network/
├── network-manager.ts       # 网络管理器核心实现
└── types.ts                # 类型定义
```

#### 基本用法

```typescript
// 导入网络管理器工厂函数
import { createNetworkManager } from '@/core/services/infrastructure/network/network-manager';

// 创建网络管理器实例
const networkManager = createNetworkManager();

// 检查当前网络状态
const isConnected = networkManager.isConnected();
console.log('当前网络状态:', isConnected ? '在线' : '离线');

// 监听网络连接事件
networkManager.onConnect(() => {
  console.log('网络已连接');
  // 执行网络恢复后的操作，如刷新数据
  refreshData();
});

// 监听网络断开事件
networkManager.onDisconnect(() => {
  console.log('网络已断开');
  // 执行网络断开后的操作，如显示离线提示
  showOfflineNotification();
});
```

#### 与数据服务集成

网络管理服务设计为可与各种数据服务集成，特别是与数据预加载服务的集成示例：

```typescript
// 在数据预加载服务中集成网络管理
class DataPreloadService {
  private networkManager: NetworkManager;
  
  constructor() {
    this.networkManager = createNetworkManager();
    
    // 监听网络恢复事件
    this.networkManager.onConnect(() => {
      if (this.config.preloadOnNetworkReconnect) {
        // 网络恢复时自动预加载数据
        this.preloadAll();
      }
    });
    
    // 监听网络断开事件
    this.networkManager.onDisconnect(() => {
      // 可以在这里执行网络断开时的特殊处理
      this.emit('network:offline');
    });
  }
}
```

#### 高级用法

网络管理服务支持更多高级功能，如网络类型检测和连接质量监控：

```typescript
// 检查网络类型（需要在移动端环境）
const networkType = await networkManager.getNetworkType();
console.log('当前网络类型:', networkType); // 'wifi', 'cellular', 'none', 等

// 监听网络类型变化
networkManager.onNetworkTypeChange((type) => {
  console.log('网络类型已变更为:', type);
  
  // 根据网络类型调整应用行为
  if (type === 'wifi') {
    // 在WiFi环境下可以执行更多数据同步
    syncLargeData();
  } else if (type === 'cellular') {
    // 在蜂窝网络下减少数据使用
    enableDataSavingMode();
  }
});
```
```
```

## 4. UI组件规范 (Ionic + Tailwind)

### 混合UI组件架构
```
src/core/components/
├── ui/                     # 纯Tailwind组件
│   ├── Button.tsx
│   └── Card.tsx
├── ionic/                  # Ionic组件封装
│   ├── IonButton.tsx       # 带Tailwind样式的Ionic按钮
│   └── IonCard.tsx
└── hybrid/                 # 混合组件
    ├── AppHeader.tsx       # 自适应页头
    └── FormInput.tsx       # 平台感知输入框
```

### Ionic组件封装示例
```typescript
// src/core/components/ionic/IonButton.tsx
import { IonButton as NativeIonButton } from '@ionic/react'
import { twMerge } from 'tailwind-merge'
import { useI18n } from '@/core/lib/i18n'

export function IonButton({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NativeIonButton>) {
  const t = useI18n()
  
  return (
    <NativeIonButton
      className={twMerge(
        'font-medium rounded-lg shadow-sm',
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? t(children) : children}
    </NativeIonButton>
  )
}
```

### 平台自适应组件
```typescript
// src/core/components/hybrid/AppHeader.tsx
import { Capacitor } from '@capacitor/core'
import { useI18n } from '@/core/lib/i18n'
import { IonToolbar, IonTitle } from '@ionic/react'
import { twMerge } from 'tailwind-merge'

export function AppHeader({ title }: { title: string }) {
  const t = useI18n()
  const isMobile = Capacitor.isNativePlatform()
  
  return isMobile ? (
    <IonToolbar className="px-4">
      <IonTitle>{t(title)}</IonTitle>
    </IonToolbar>
  ) : (
    <header className="px-6 py-4 border-b">
      <h1 className="text-2xl font-bold">{t(title)}</h1>
    </header>
  )
}
```

## 5. 样式系统规范

### Tailwind配置增强
```javascript
// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@ionic/react/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        primary: colors.indigo,
        secondary: colors.slate,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 国际化样式处理
```css
/* src/styles/global.css */
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 阿拉伯语等RTL语言支持 */
[dir='rtl'] {
  direction: rtl;
}

/* Ionic组件覆盖 */
.ion-page {
  @apply bg-white dark:bg-gray-900;
}
```

## 6. API路由国际化

### 国际化中间件
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

const locales = ['en', 'zh', 'ja']
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  const headers = { 'accept-language': request.headers.get('accept-language') || '' }
  const languages = new Negotiator({ headers }).languages()
  return match(languages, locales, defaultLocale)
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)
    return NextResponse.redirect(
      new URL(`/${locale}/${pathname}`, request.url)
    )
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 国际化API响应
```typescript
// app/api/products/route.ts
import { db } from '@/core/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const locale = new URL(request.url).pathname.split('/')[1] || 'en'
  const products = await db.getLocalizedProducts(locale)
  
  return NextResponse.json(products)
}
```

## 7. 移动端特定增强

### Capacitor插件国际化
```typescript
// src/mobile/plugins/toast.ts
import { Toast } from '@capacitor/toast'
import { useI18n } from '@/core/lib/i18n'

export class LocalizedToast {
  static async show(options: { 
    message: string 
    duration?: 'short' | 'long'
  }) {
    const t = await import('@/core/lib/i18n/config').then(m => m.useI18n())
    return Toast.show({
      ...options,
      text: t(options.message)
    })
  }
}

// 使用示例
LocalizedToast.show({ message: 'errors.network' })
```

### 移动端语言切换
```typescript
// src/mobile/hooks/useDeviceLocale.ts
import { useEffect } from 'react'
import { Device } from '@capacitor/device'
import { useChangeLocale } from '@/core/lib/i18n/config'

export function useDeviceLocale() {
  const changeLocale = useChangeLocale()

  useEffect(() => {
    const detectDeviceLocale = async () => {
      const { value } = await Device.getLanguageCode()
      const supportedLocales = process.env.SUPPORTED_LOCALES?.split(',') || ['en']
      const locale = supportedLocales.find(l => l.startsWith(value)) || 'en'
      changeLocale(locale)
    }
    
    detectDeviceLocale()
  }, [changeLocale])
}
```

## 8. 测试策略增强

### 国际化测试工具
```typescript
// test/utils/i18n.ts
import { render } from '@testing-library/react'
import { I18nProvider } from '@/core/lib/i18n/config'
import en from '@/core/lib/i18n/dictionaries/en/common.json'

export function renderWithI18n(
  ui: React.ReactElement,
  { locale = 'en', dictionary = en } = {}
) {
  return render(
    <I18nProvider locale={locale} dictionary={{ common: dictionary }}>
      {ui}
    </I18nProvider>
  )
}

// 测试示例
test('displays localized text', () => {
  const { getByText } = renderWithI18n(<SubmitButton />)
  expect(getByText(en.buttons.submit)).toBeInTheDocument()
})
```

### 数据库测试增强
```typescript
// test/lib/db/local/sqlite.test.ts
import { withTempDatabase } from '@/test/utils/dbHelpers'
import { SQLiteClient } from '@/core/lib/db/local/sqlite'

describe('SQLiteClient', () => {
  it('handles localized data', async () => {
    await withTempDatabase('sqlite', async (db) => {
      const product = await db.createProduct({
        name: {
          en: 'Smartphone',
          zh: '智能手机',
          default: 'Smartphone'
        },
        description: {
          en: 'Latest model',
          zh: '最新型号',
          default: 'Latest model'
        },
        price: 999
      })
      
      const enProduct = await db.getLocalizedProduct(product.id, 'en')
      expect(enProduct.name).toBe('Smartphone')
      
      const zhProduct = await db.getLocalizedProduct(product.id, 'zh')
      expect(zhProduct.name).toBe('智能手机')
    })
  })
})
```

## 9. 构建与部署

### 多语言静态生成
```typescript
// app/[locale]/products/page.tsx
import { generateStaticParams } from '@/core/lib/i18n/config'
import { db } from '@/core/lib/db'

export async function generateStaticParams() {
  const locales = process.env.SUPPORTED_LOCALES?.split(',') || ['en']
  const products = await db.getProducts()
  
  return locales.flatMap(locale => 
    products.map(product => ({
      locale,
      productId: product.id
    }))
  )
}

export default function ProductPage({
  params
}: {
  params: { locale: string; productId: string }
}) {
  // 页面实现...
}
```

### 移动端构建脚本
```json
{
  "scripts": {
    "build:android": "next build && next export && npx cap sync android",
    "build:ios": "next build && next export && npx cap sync ios",
    "build:i18n": "bun run build && bun run export && node scripts/generate-i18n-files.js"
  }
}
```

## 10. 性能优化

### 按语言代码分割
```typescript
// src/core/components/LazyLocaleComponent.tsx
import { Suspense, lazy } from 'react'
import { useCurrentLocale } from '@/core/lib/i18n/config'

export function LazyLocaleComponent() {
  const locale = useCurrentLocale()
  const Component = lazy(() => import(`./heavy-components/${locale}/Component`))
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  )
}
```

### 本地化图片优化
```typescript
// src/core/components/LocalizedImage.tsx
import Image from 'next/image'
import { useCurrentLocale } from '@/core/lib/i18n/config'

export function LocalizedImage({
  src,
  alt,
  ...props
}: {
  src: Record<string, string> | string
  alt: string
} & React.ComponentProps<typeof Image>) {
  const locale = useCurrentLocale()
  const imageSrc = typeof src === 'string' ? src : src[locale] || src.default
  
  return (
    <Image 
      src={imageSrc} 
      alt={alt}
      {...props}
    />
  )
}
```

这套完整的规则集为 Capacitor-Next.js 15 + Ionic + Tailwind 全栈项目提供了从国际化到数据演进的全方位规范，确保项目在跨平台、多语言环境下保持高度一致性和可维护性。

## 11. 版本控制策略与团队协作工作流程

### Git分支策略
```
项目分支结构：
├── main                    # 生产环境分支，稳定版本
├── develop                 # 开发环境主分支
├── feature/               # 功能分支目录
│   ├── feature/auth        # 认证功能分支
│   └── feature/payment     # 支付功能分支
├── release/               # 发布分支目录
│   └── release/v1.0.0      # 特定版本发布分支
├── hotfix/                # 紧急修复分支目录
│   └── hotfix/auth-bug     # 认证模块紧急修复
└── i18n/                  # 国际化分支目录
    └── i18n/zh-support     # 中文支持分支
```

#### 分支命名规范
```typescript
// 功能分支命名规范
feature/<功能模块>-<简短描述>
// 例如: feature/auth-social-login

// 修复分支命名规范
fix/<问题编号>-<简短描述>
// 例如: fix/issue-42-header-alignment

// 发布分支命名规范
release/v<主版本>.<次版本>.<修订版本>
// 例如: release/v1.2.0

// 热修复分支命名规范
hotfix/v<版本>-<简短描述>
// 例如: hotfix/v1.1.1-login-crash

// 国际化分支命名规范
i18n/<语言代码>-<功能描述>
// 例如: i18n/fr-user-profile
```

#### 提交信息规范
```
<类型>(<作用域>): <描述>

[可选的正文]

[可选的脚注]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `style`: 代码风格调整
- `refactor`: 代码重构
- `test`: 测试相关
- `build`: 构建系统或外部依赖变更
- `ci`: CI配置变更
- `chore`: 其他变更
- `i18n`: 国际化相关

示例：
```
feat(auth): 添加社交媒体登录功能

实现了Google和Facebook OAuth登录
支持用户头像和基本信息同步

Closes #123
```

### PR流程与代码审查标准

#### PR模板
```markdown
## 变更描述

[描述此PR的目的和变更内容]

## 相关问题

[关联的Issue编号，例如 #123]

## 变更类型

- [ ] 新功能 (feature)
- [ ] Bug修复 (bugfix)
- [ ] 性能优化 (performance)
- [ ] 代码重构 (refactor)
- [ ] 样式调整 (style)
- [ ] 测试 (test)
- [ ] 文档 (documentation)
- [ ] 构建或CI (build/ci)
- [ ] 其他

## 自测清单

- [ ] 我已在本地测试了这些变更
- [ ] 我已添加必要的测试用例
- [ ] 我已更新相关文档

## 截图（如适用）

[添加相关截图]

## 其他信息

[任何其他相关信息]
```

#### 代码审查标准

##### 功能性审查
- 代码是否实现了预期功能？
- 是否处理了边缘情况和错误情况？
- 是否有适当的错误处理和用户反馈？
- 功能是否在所有目标平台（Web、iOS、Android）上正常工作？

##### 代码质量审查
- 代码是否遵循项目的编码规范？
- 是否有重复代码可以提取为共享函数？
- 变量和函数命名是否清晰且一致？
- 是否有不必要的复杂性？

##### 性能审查
- 代码是否有明显的性能问题？
- 是否有不必要的重渲染或计算？
- 数据获取和状态管理是否高效？

##### 安全审查
- 是否有潜在的安全漏洞？
- 用户输入是否得到适当验证和清理？
- 敏感数据是否得到适当保护？

##### 国际化审查
- 所有用户可见的文本是否已国际化？
- 日期、数字和货币格式是否考虑了本地化？
- UI布局是否适应不同语言的文本长度？

### 模块化开发责任分配

#### 模块所有权矩阵
```
模块               | 主要负责团队    | 次要支持团队    | 文档负责人
------------------|--------------|--------------|------------
核心架构           | 架构团队       | 全栈团队       | 架构师
认证与用户管理      | 后端团队       | 前端团队       | 后端负责人
用户界面组件库      | 前端团队       | 设计团队       | 前端负责人
移动端原生集成      | 移动端团队     | 架构团队       | 移动端负责人
数据库与存储        | 后端团队       | DevOps团队    | 数据库专家
国际化框架         | 前端团队       | 本地化团队     | 国际化负责人
API与服务集成      | 后端团队       | 前端团队       | API负责人
测试自动化         | QA团队        | 全栈团队       | QA负责人
构建与部署         | DevOps团队    | 架构团队       | DevOps负责人
```

#### 跨团队协作流程

1. **功能规划阶段**
   - 创建功能规格文档，包含技术要求和UI/UX设计
   - 召开跨团队设计会议，确定技术方案和责任分配
   - 创建相关Issue并分配给相应团队

2. **开发阶段**
   - 每日同步会议，讨论进度和阻碍
   - 使用共享看板跟踪任务状态
   - 定期代码集成，避免大型合并冲突

3. **测试与发布阶段**
   - 跨团队测试会议，确保功能在所有平台正常工作
   - 创建发布清单，包含所有变更和测试结果
   - 发布后监控，快速响应潜在问题

### 多语言内容协作流程

#### 国际化工作流
```
内容创建 → 提取可翻译文本 → 翻译 → 集成翻译 → 验证 → 发布
```

#### 翻译管理系统集成
```typescript
// scripts/i18n/extract.ts
import * as fs from 'fs'
import * as path from 'path'
import { extractMessagesFromFiles } from 'i18n-extract-tools'

// 从源代码中提取需要翻译的文本
async function extractTranslatableMessages() {
  const messages = await extractMessagesFromFiles([
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}'
  ])
  
  // 生成翻译模板文件
  const templatePath = path.join(process.cwd(), 'src/core/lib/i18n/templates')
  if (!fs.existsSync(templatePath)) {
    fs.mkdirSync(templatePath, { recursive: true })
  }
  
  fs.writeFileSync(
    path.join(templatePath, 'messages.json'),
    JSON.stringify(messages, null, 2)
  )
  
  console.log(`提取了 ${Object.keys(messages).length} 条可翻译文本`)
}

extractTranslatableMessages()
```

#### 翻译审查流程

1. **翻译准备**
   - 从代码库中提取新的可翻译文本
   - 创建翻译任务并分配给翻译人员或服务

2. **翻译过程**
   - 翻译人员在翻译管理系统中完成翻译
   - 技术团队成员审查翻译中的变量和格式占位符
   - 本地语言专家审查翻译质量和文化适应性

3. **翻译集成**
   - 创建专门的i18n分支集成新翻译
   - 自动化测试验证翻译文件格式
   - 视觉测试确保UI适应不同语言

4. **持续更新**
   - 建立翻译更新周期，定期同步最新内容
   - 维护翻译记忆库，确保术语一致性
   - 监控翻译覆盖率，确保完整支持所有语言

#### 多语言测试矩阵
```
测试类型           | 主要语言(en)  | 次要语言(zh,ja) | 其他语言
-----------------|-------------|---------------|--------
功能测试           | 全覆盖        | 全覆盖          | 关键路径
视觉测试           | 全覆盖        | 全覆盖          | 抽样检查
本地化验证         | N/A          | 全覆盖          | 全覆盖
性能测试           | 全覆盖        | 抽样检查        | 最长文本
```

这套版本控制策略和团队协作工作流程为 Capacitor-Next.js 15 + Ionic + Tailwind 全栈项目提供了完整的协作规范，确保团队成员能够高效协作，同时保持代码质量和项目一致性。

## 12. 辅助编程工具开发流程

### 辅助编程工具集成策略

```
项目辅助工具链：
├── AI编程助手              # Claude/GPT等大语言模型工具
├── 代码生成工具            # 组件/模板生成器
├── 静态分析工具            # ESLint/TypeScript
├── 自动化测试工具          # Jest/Cypress
└── 文档生成工具            # TypeDoc/Storybook
```

### AI辅助编程工作流

#### 初始化阶段
```
需求分析 → 架构设计 → AI辅助设计评审 → 任务分解 → 分支创建
```

#### 开发阶段工作流
```typescript
// 1. 创建功能分支
git checkout -b feature/auth-social-login

// 2. 使用AI助手生成初始代码框架
// 示例提示词："基于我们的项目架构，为社交媒体登录功能创建组件和服务框架，
// 需要支持Google和Facebook登录，并集成到我们的认证系统中。"

// 3. 代码审查与优化
// 示例提示词："请审查以下社交登录组件代码，检查是否有性能问题、
// 安全隐患或不符合我们项目规范的地方。"

// 4. 提交代码
git add .
git commit -m "feat(auth): 添加社交媒体登录框架"

// 5. 单元测试生成
// 示例提示词："为以下社交登录服务生成Jest单元测试，
// 需要测试成功登录、失败处理和令牌刷新等场景。"

// 6. 完成功能并提交
git commit -m "test(auth): 添加社交登录测试用例"
如果没有设置远程仓库地址，则暂不push
git push origin feature/auth-social-login
```

#### AI辅助代码审查
```
代码提交 → AI预审查 → 人工审查 → 反馈修正 → 合并
```

### AI提示词模板

#### 组件生成模板
```
请为[功能名称]创建一个React组件，需要满足以下要求：
1. 遵循我们项目的Ionic+Tailwind混合UI架构
2. 支持国际化，使用我们的useI18n hook
3. 适配移动端和Web端不同布局
4. 包含必要的类型定义和PropTypes
5. 实现以下功能：[具体功能描述]

我们的项目结构如下：
[项目结构简要描述]
```

#### 服务层生成模板
```
请为[功能名称]创建一个服务层实现，需要满足以下要求：
1. 遵循我们的数据演进策略，支持多种数据源
2. 处理国际化数据字段
3. 实现错误处理和重试机制
4. 包含完整的TypeScript类型定义
5. 实现以下API：[API列表]

相关的数据模型如下：
[数据模型描述]
```

#### 代码审查模板
```
请审查以下[组件/服务]代码，重点关注：
1. 是否符合我们的编码规范
2. 是否存在性能问题
3. 是否正确处理了国际化
4. 是否有潜在的安全问题
5. 是否有改进空间

代码如下：
[代码片段]
```

### AI辅助文档生成

#### 组件文档模板
```typescript
// 使用AI生成组件文档示例
// 提示词："为以下社交登录组件生成Storybook文档，
// 包括组件描述、属性说明、使用示例和不同状态展示。"

// 生成的文档示例
/**
 * SocialLoginButton组件
 * 
 * 提供统一的社交媒体登录按钮，支持多种登录提供商和自定义样式。
 * 
 * @component
 * @example
 * ```tsx
 * <SocialLoginButton 
 *   provider="google" 
 *   onSuccess={handleSuccess} 
 *   onError={handleError}
 * />
 * ```
 * 
 * @prop {"google"|"facebook"|"twitter"} provider - 登录提供商
 * @prop {(response: AuthResponse) => void} onSuccess - 登录成功回调
 * @prop {(error: Error) => void} onError - 登录失败回调
 * @prop {string} [className] - 自定义CSS类名
 * @prop {"small"|"medium"|"large"} [size="medium"] - 按钮大小
 */
```

### 跨平台测试自动化

#### 测试矩阵生成
```typescript
// 使用AI生成测试矩阵示例
// 提示词："为社交登录功能生成跨平台测试矩阵，
// 需要覆盖Web、iOS和Android平台，以及不同的登录场景。"

// 生成的测试矩阵
/**
 * 社交登录测试矩阵
 * 
 * 平台 x 提供商 x 场景
 * 
 * 平台：
 * - Web (Chrome, Firefox, Safari)
 * - iOS (iPhone, iPad)
 * - Android (Phone, Tablet)
 * 
 * 提供商：
 * - Google
 * - Facebook
 * - Twitter
 * 
 * 场景：
 * - 首次登录
 * - 重复登录
 * - 取消登录
 * - 网络中断
 * - 权限拒绝
 * - 令牌过期
 */
```

### AI辅助代码重构

#### 重构提示词模板
```
请帮我重构以下[组件/服务]代码，目标是：
1. 提高性能，减少不必要的重渲染
2. 改进代码组织，提高可维护性
3. 增强类型安全性
4. 优化国际化实现
5. [其他具体目标]

当前代码：
[代码片段]

项目上下文：
[相关依赖和架构信息]
```

### 辅助工具使用规范

1. **代码所有权**：AI生成的代码必须经过团队成员审查和理解，确保团队对所有代码有完全掌控。

2. **提示词版本控制**：将有效的提示词模板添加到项目文档中，便于团队复用。

3. **生成代码标记**：在提交信息中标记AI辅助生成的代码，便于追踪和审查。
   ```
   feat(auth): 添加社交登录组件 [AI-assisted]
   ```

4. **安全审查**：AI生成的代码必须经过额外的安全审查，特别是涉及认证、数据处理的部分。

5. **持续学习**：定期分享有效的AI辅助编程实践，更新团队的提示词库和最佳实践。

这套辅助编程工具开发流程为 Capacitor-Next.js 15 + Ionic + Tailwind 全栈项目提供了现代化的开发加速方案，通过结合AI工具与传统开发实践，显著提高开发效率和代码质量，同时保持团队对代码的完全掌控和理解。

## 13. 前端开发规范

### 13.1 组件开发规范

#### 13.1.1 组件结构
```typescript
// 组件文件结构
ComponentName/
├── index.tsx              # 主组件文件
├── types.ts               # 类型定义
├── styles.module.css      # 样式文件（如果需要）
├── __tests__/             # 测试文件目录
│   └── ComponentName.test.tsx
└── __stories__/           # Storybook文档目录
    └── ComponentName.stories.tsx
```

#### 13.1.2 组件命名规范
- 使用 PascalCase 命名组件
- 使用 camelCase 命名组件文件
- 使用 kebab-case 命名样式文件
- 使用 PascalCase 命名类型和接口

#### 13.1.3 组件编写规范
```typescript
// 组件模板
import React from 'react';
import { useI18n } from '@/core/lib/i18n';
import type { ComponentProps } from './types';

export function ComponentName({
  prop1,
  prop2,
  ...props
}: ComponentProps) {
  const t = useI18n();
  
  return (
    <div className="component-name">
      {/* 组件内容 */}
    </div>
  );
}
```

### 13.2 状态管理规范

#### 13.2.1 状态选择原则
1. 组件内部状态：使用 `useState`
2. 共享状态：使用 `useContext` + `useReducer`
3. 复杂状态：考虑使用 Zustand 或 Jotai
4. 服务端状态：使用 React Query 或 SWR

#### 13.2.2 状态更新规范
```typescript
// 状态更新示例
const [state, setState] = useState<State>(initialState);

// 使用函数式更新
setState(prev => ({ ...prev, newValue }));

// 批量更新
const updateMultiple = () => {
  setState(prev => ({
    ...prev,
    value1: newValue1,
    value2: newValue2
  }));
};
```

### 13.3 样式开发规范

#### 13.3.1 Tailwind 使用规范
1. 优先使用 Tailwind 类名
2. 复杂样式使用 CSS Modules
3. 动态样式使用 clsx 或 classnames
4. 主题相关样式使用 CSS 变量

#### 13.3.2 响应式设计规范
```typescript
// 响应式组件示例
export function ResponsiveComponent() {
  return (
    <div className="
      w-full
      md:w-1/2
      lg:w-1/3
      p-4
      md:p-6
      lg:p-8
    ">
      {/* 内容 */}
    </div>
  );
}
```

### 13.4 性能优化规范

#### 13.4.1 组件优化
1. 使用 `React.memo` 避免不必要的重渲染
2. 使用 `useMemo` 和 `useCallback` 缓存值和函数
3. 使用 `lazy` 和 `Suspense` 实现代码分割
4. 使用 `useTransition` 处理非紧急更新

#### 13.4.2 图片优化
1. 使用 Next.js Image 组件
2. 实现懒加载
3. 使用适当的图片格式和大小
4. 实现响应式图片

### 13.5 测试规范

#### 13.5.1 单元测试
```typescript
// 组件测试示例
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop1="value" />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

#### 13.5.2 集成测试
1. 测试组件交互
2. 测试状态更新
3. 测试异步操作
4. 测试错误处理

## 14. 后端开发规范

### 14.1 API 设计规范

#### 14.1.1 RESTful API 规范
1. 使用 HTTP 方法表示操作
2. 使用复数名词表示资源
3. 使用嵌套表示关系
4. 使用查询参数进行过滤和排序

#### 14.1.2 API 响应格式
```typescript
// 成功响应
{
  "data": {
    // 响应数据
  },
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 100
  }
}

// 错误响应
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息",
    "details": {
      // 详细信息
    }
  }
}
```

### 14.2 数据库操作规范

#### 14.2.1 查询优化
1. 使用索引优化查询
2. 避免 N+1 查询问题
3. 使用适当的查询方法
4. 实现查询缓存

#### 14.2.2 事务处理
```typescript
// 事务处理示例
async function handleTransaction() {
  const transaction = await db.transaction();
  try {
    await transaction.begin();
    // 执行操作
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### 14.3 错误处理规范

#### 14.3.1 错误类型
1. 业务错误：使用自定义错误类
2. 验证错误：使用验证库
3. 系统错误：使用标准错误类
4. 网络错误：使用 HTTP 错误

#### 14.3.2 错误处理流程
```typescript
// 错误处理示例
try {
  // 业务逻辑
} catch (error) {
  if (error instanceof ValidationError) {
    // 处理验证错误
  } else if (error instanceof BusinessError) {
    // 处理业务错误
  } else {
    // 处理系统错误
  }
}
```

### 14.4 日志规范

#### 14.4.1 日志级别
1. ERROR：错误信息
2. WARN：警告信息
3. INFO：一般信息
4. DEBUG：调试信息

#### 14.4.2 日志格式
```typescript
// 日志记录示例
logger.info('Operation completed', {
  operation: 'createUser',
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

### 14.5 安全规范

#### 14.5.1 认证授权
1. 使用 JWT 进行认证
2. 实现 RBAC 权限控制
3. 使用 HTTPS
4. 实现请求限流

#### 14.5.2 数据安全
1. 加密敏感数据
2. 实现数据备份
3. 实现审计日志
4. 实现数据验证

## 15. 产品需求开发流程

### 15.1 需求分析阶段

#### 15.1.1 需求文档模板
```markdown
# 功能需求文档

## 1. 功能概述
[描述功能的主要目的和范围]

## 2. 用户故事
[描述用户使用场景]

## 3. 技术需求
[描述技术实现要求]

## 4. 验收标准
[描述功能验收标准]

## 5. 时间规划
[描述开发时间安排]
```

#### 15.1.2 技术方案设计
1. 架构设计
2. 数据模型设计
3. API 设计
4. UI/UX 设计

### 15.2 开发阶段

#### 15.2.1 前端开发流程
1. 组件开发
2. 状态管理
3. API 集成
4. 测试编写
5. 文档编写

#### 15.2.2 后端开发流程
1. 数据库设计
2. API 实现
3. 业务逻辑
4. 测试编写
5. 文档编写

### 15.3 测试阶段

#### 15.3.1 测试计划
1. 单元测试
2. 集成测试
3. E2E 测试
4. 性能测试

#### 15.3.2 测试用例模板
```markdown
# 测试用例

## 测试场景
[描述测试场景]

## 前置条件
[描述测试前置条件]

## 测试步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 预期结果
[描述预期结果]

## 实际结果
[记录实际结果]
```

### 15.4 部署阶段

#### 15.4.1 部署检查清单
1. 代码审查
2. 测试通过
3. 文档更新
4. 性能检查
5. 安全检查

#### 15.4.2 发布流程
1. 版本标记
2. 构建打包
3. 环境部署
4. 监控检查
5. 回滚计划

这套完整的前后端开发规范和产品需求开发流程为团队提供了统一的开发标准，确保代码质量和项目可维护性，同时提高团队协作效率。