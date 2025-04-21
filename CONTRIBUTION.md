# HeyTCM-vibe coding starter

文档和提示词驱动的使用 AI 编程工具来实现 App 产品开发的 vibe coding starter。其中包含了通用型的文档 docs，用于驱动新的 App 开发。包括了使用这些文档和提示来构建类 Tinder 约会 App 的 tasks 任务和具体代码实现。

HeyTCM 是一个基于 Next.js 15.x、Ionic、TailwindCSS 和 Capacitor 的全栈启动项目，专注于提供 AI 辅助开发的最佳实践和工具链。

## 项目特点

- **AI 驱动开发**：通过文档和提示词驱动 AI 辅助开发流程
- **全栈解决方案**：集成了前端、移动端和数据库的完整技术栈
- **渐进式开发**：支持从 Mock 数据到生产环境的平滑过渡
- **跨平台支持**：同时支持 Web 和移动端（iOS/Android）开发
- **离线优先**：内置完善的离线存储和同步机制
- **文档驱动**：提供详细的开发指南和最佳实践文档

## 环境要求

- Node.js (v16+)
- bun 或 yarn
- Git

## 开始使用

1. 克隆仓库:
   ```bash
   git clone https://github.com/your-org/heytcm.git
   cd heytcm/new-starter
   ```

2. 安装依赖:
   ```bash
   bun install
   # 或
   yarn install
   ```

3. 配置环境变量:
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，设置必要的环境变量
   ```

4. 运行开发服务器:
   ```bash
   bun run dev
   # 或
   yarn dev
   ```

5. 访问应用:
   打开浏览器访问 `http://localhost:3000`

6. 构建移动应用:
   ```bash
   # iOS
   bun run build:ios && bunx cap open ios
   
   # Android
   bun run build:android && bunx cap open android
   ```

## 项目结构

```
src/
├── app/                # Next.js 应用目录
│   ├── mobile/        # 移动端页面
│   ├── web/           # Web端页面
│   └── api/           # API路由
├── core/              # 核心功能
│   ├── lib/          # 库文件
│   │   ├── db/      # 数据库相关
│   │   └── utils/   # 工具函数
│   └── services/    # 服务层
├── components/        # 共享组件
├── hooks/            # 自定义Hooks
├── styles/           # 样式文件
└── types/            # 类型定义
```

## 技术栈

### 前端
- **框架**: Next.js 14.x
- **UI库**: TailwindCSS 3.x
- **状态管理**: React Context + Hooks
- **移动端适配**: Capacitor 5.x

### 数据层
- **Web端存储**: IndexedDB
- **移动端存储**: SQLite (通过Capacitor)
- **API通信**: Fetch API, SWR
- **数据同步**: 自定义SyncManager

### 开发工具
- **TypeScript**: 5.x
- **ESLint & Prettier**: 代码格式化和质量控制
- **Jest & React Testing Library**: 单元测试和集成测试
- **Storybook**: UI组件开发和文档

## 环境配置

项目支持多种环境配置：

- **开发环境** (.env.development)
- **生产环境** (.env.production)
- **Mock环境** (.env.mock)
- **本地环境** (.env.local)

每个环境都有其特定的配置，包括数据库、API、认证等设置。

## 数据库架构

数据库架构采用分层设计，支持多环境数据存储和同步：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现
│   ├── capacitor-sqlite/  # 移动端SQLite
│   ├── indexeddb/        # Web端IndexedDB
│   │   └── fake-indexeddb.ts  # 模拟IndexedDB的客户端离线存储
│   ├── mock/            # Mock环境实现（模拟远程数据存储）
│   └── base-client.ts   # 基础客户端抽象
├── repositories/     # 数据访问层
├── schema/          # 数据模型定义
├── types/           # 类型定义
└── service.ts       # 核心服务实现
```

## 贡献指南（Contribution Guide）

本项目采用分层文档结构与 AI 辅助开发规范，建议所有贡献者遵循 vibe-coding-guide.md 与 guides/README.md 的流程和规范。

## 快速开始

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-org/heytcm.git
   cd heytcm/new-starter
   ```

2. 安装依赖：
   ```bash
   bun install
   # 或
   yarn install
   ```

3. 配置环境变量：
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，设置必要的环境变量
   ```

4. 运行开发服务器：
   ```bash
   bun run dev
   # 或
   yarn dev
   ```

5. 贡献流程与开发规范
   - 请优先查阅 [vibe-coding-guide.md](./vibe-coding-guide.md) 获取开发全流程范式与最佳实践。
   - 代码、文档、脚本等所有贡献需遵循 guides/README.md 的结构和命名规范。
   - 提交前请确保通过 lint、测试和格式化检查。
   - 详细贡献流程、分支策略、PR 模板等见 guides/development/README.md。

6. 代码风格与质量保障
   - 强制使用 Prettier、ESLint 统一格式
   - 单元测试与集成测试覆盖主要业务逻辑
   - 所有类型定义需统一出口（详见 guides/architecture/database/README.md）

---

如需详细开发方法与 AI 协作范式，请查阅 [vibe-coding-guide.md](./vibe-coding-guide.md)。

## 开发指南

### 数据与服务开发

1. **数据库开发**：
   - 项目采用分层存储架构：
     - **远程数据层**：使用服务器/云端存储（生产环境）或 MockDatabaseClient（开发环境）
     - **本地离线存储层**：使用 IndexedDB/SQLite（生产环境）或 MockIndexedDBClient（开发环境）
   - 从模拟(Mock)数据开始，逐步过渡到本地数据库，最后到生产环境
   - 确保同时测试在线和离线场景，验证数据同步机制

2. **服务层开发**：
   - 使用单例模式和工厂模式
   - 实现离线支持和网络状态响应
   - 所有UI组件都应通过服务访问数据，而非直接访问数据库
   - 服务应抽象存储层细节，处理远程数据和本地缓存之间的转换和同步

3. **环境配置**：
   - 开发环境：
     ```
     # 基本配置
     NEXT_PUBLIC_DATABASE_ENV=mock
     
     # 高级配置（启用双存储模拟）
     NEXT_PUBLIC_MOCK_DB_TYPE=hybrid    # 或 'memory'/'json'/'mock-indexeddb'
     NEXT_PUBLIC_USE_FAKE_INDEXEDDB=true
     ```
   - 本地数据库测试：`NEXT_PUBLIC_DATABASE_ENV=local`
   - 生产环境测试：`NEXT_PUBLIC_DATABASE_ENV=production`

4. **测试与调试**：
   - 测试离线场景：关闭网络连接并验证功能
   - 测试同步机制：模拟网络中断后恢复，观察数据如何在两个存储层之间同步
   - 使用 `DataServiceFactory.setUseMockData(true)` 强制使用模拟数据
   - 检查 `localStorage` 和 `IndexedDB` 中的数据（Web环境）
   - 监控同步操作和网络请求

## 报告问题

发现问题时，请在 issues 页面提交，并提供以下信息：
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、浏览器、设备等）
- 截图（如适用）

## 许可证

MIT