# 项目文档索引

本文档提供了项目中所有文档的索引，帮助开发者快速找到所需的文档。

## 开发环境建议

- **推荐使用Git Bash**：在Windows环境下，对于批量文件操作和自动化脚本任务，请优先使用Git Bash而非PowerShell或CMD。详见[Shell脚本最佳实践](./guides/shell-scripting-practices.md)。
- **在Cursor中配置Git Bash**：将Cursor的集成终端设置为使用Git Bash，方法是在设置中搜索"terminal"并将"Terminal › Integrated › Default Profile: Windows"设置为"Git Bash"。

## 快速入门

### 环境要求
- Node.js (v16+)
- npm 或 yarn
- Git
- Git Bash (Windows环境下)

### 开始使用
1. 克隆仓库: 
   ```bash
   git clone https://github.com/your-org/heytcm.git
   cd heytcm/new-starter
   ```

2. 安装依赖: 
   ```bash
   npm install
   # 或
   yarn install
   ```

3. 运行开发服务器: 
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

4. 访问应用: 打开浏览器访问 `http://localhost:3000`

5. 构建移动应用:
   ```bash
   # iOS
   npm run build:ios && npx cap open ios
   
   # Android
   npm run build:android && npx cap open android
   ```

查看[项目初始化指南](./guides/project-initialization-guide.md)获取更详细的设置步骤。

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

## 项目指南

- [项目初始化指南](./guides/project-initialization-guide.md) - 项目初始化的步骤和说明
- [开发流程指南](./guides/development-process-guide.md) - 项目开发流程的说明
- [Git分支策略](./guides/git-branch-strategy.md) - 项目Git分支策略的说明
- [导入路径规范](./guides/import-path-standards.md) - 规定使用 @/ 前缀绝对路径而非相对路径的导入规范
- [导入路径实施细节](./guides/import-path-enforcement-implementation.md) - 详细说明导入路径规范的实施措施和工具
- [导入路径更新摘要](./guides/import-path-updates-summary.md) - 导入路径更新的摘要信息
- [项目状态](./guides/project-status.md) - 项目的当前状态和进展

## 数据与架构

### 数据库架构

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

存储策略：
- **开发阶段(Mock)**:
  - **远程数据存储模拟**: 使用 MockDatabaseClient (内存/JSON模式)，模拟服务器端数据
  - **客户端离线存储模拟**: 使用 MockIndexedDBClient (fake-indexeddb)，模拟浏览器的本地存储
  - 这种双层模拟策略与实际生产环境的架构一致，便于测试在线/离线场景
- **本地阶段(Local)**:
  - **Web离线存储**: 使用IndexedDB
  - **测试环境**: 使用fake-indexeddb模拟客户端离线存储
  - **移动端存储**: 使用SQLite
- **生产阶段(Production)**:
  - **远程存储**: Firebase/Supabase等云端服务
  - **本地离线缓存**: IndexedDB(Web)或SQLite(移动端)

同步策略：
- **在线优先**: 用户注册、个人资料更新
- **离线优先**: 消息、匹配操作
- **手动同步**: 批量数据同步、大文件传输
- **离线存储**: 本地数据，永不同步到云端

### 服务层架构

服务层采用分层架构：

```
UI组件层 (Components)
      ↓
服务层 (UserService, MessageService, 等)
      ↓
数据访问层 (DataServiceFactory → DatabaseService/MockDataService)
      ↓
存储层 (Repositories, SyncManager)
```

关键服务：
- **IDataService**: 数据服务统一接口
- **DatabaseService**: 主数据库服务实现
- **MockDataService**: 模拟数据服务
- **DataServiceFactory**: 数据服务工厂
- **OfflineStorageService**: 离线数据管理
- **StorageService**: 本地与云端存储
- **UserService/MessageService**: 领域服务实现

### API文档
- [数据库API文档](./guides/api/database-api.md) - 详细的数据库API使用说明和示例

## 项目预览

### 移动应用界面
![移动应用界面](./assets/screenshots/mobile-app-preview.png)

*注意: 请确保在 ./assets/screenshots/ 目录中添加相应的截图*

### Web应用界面
![Web应用界面](./assets/screenshots/web-app-preview.png)

### 架构图
![数据流架构图](./assets/diagrams/data-flow-architecture.png)

## 开发指南

### 数据与服务开发

1. **数据库开发**：
   - 项目采用分层存储架构：
     - **远程数据层**：使用服务器/云端存储（生产环境）或 MockDatabaseClient（开发环境）
     - **本地离线存储层**：使用 IndexedDB/SQLite（生产环境）或 MockIndexedDBClient（开发环境）
   - 从模拟(Mock)数据开始，逐步过渡到本地数据库，最后到生产环境
   - 确保同时测试在线和离线场景，验证数据同步机制
   - 遵循[数据库开发工作流程](./guides/database-development-workflow-updated.md)
   - 添加新数据表时，参考[添加新数据表](./guides/add-new-table.md)
   - 定义模式时确保包含合适的同步配置

2. **服务层开发**：
   - 使用单例模式和工厂模式
   - 实现离线支持和网络状态响应
   - 所有UI组件都应通过服务访问数据，而非直接访问数据库
   - 服务应抽象存储层细节，处理远程数据和本地缓存之间的转换和同步
   - 遵循[最佳实践](./guides/best-practices.md)中的服务层开发部分

3. **认证服务开发**：
   - 项目支持多种认证服务实现：
     - **Better Auth**: 自定义认证服务，支持邮箱和手机号登录
     - **Firebase Auth**: 基于Firebase的认证服务，提供完整的身份验证功能
     - **Mock Auth**: 用于开发和测试的模拟认证服务，提供预定义的测试账户
   - 认证服务配置：
     ```
     # 选择认证服务类型
     NEXT_PUBLIC_AUTH_SERVICE_TYPE=better|firebase|mock
     
     # Better Auth配置
     NEXT_PUBLIC_BETTER_AUTH_API_KEY=your_api_key
     NEXT_PUBLIC_BETTER_AUTH_API_URL=https://api.better-auth.com
     
     # Firebase Auth配置
     NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     
     # Mock Auth配置
     NEXT_PUBLIC_MOCK_AUTH_ENABLED=true
     NEXT_PUBLIC_MOCK_AUTH_USERS=test@example.com:password123,admin@example.com:admin123
     NEXT_PUBLIC_MOCK_AUTH_PHONES=+8613800138000:123456,+8613900139000:654321
     ```
   - 认证服务使用：
     ```typescript
     // 获取认证服务实例
     const authService = AuthServiceFactory.getInstance().getAuthService();
     
     // 邮箱登录
     const user = await authService.login('test@example.com', 'password123');
     
     // 手机号登录
     const user = await authService.loginWithPhone('+8613800138000', '123456');
     
     // 发送验证码
     await authService.sendVerificationCode('+8613800138000');
     
     // 获取当前用户
     const currentUser = authService.getCurrentUser();
     
     // 检查认证状态
     const isAuthenticated = authService.isAuthenticated();
     
     // 登出
     await authService.logout();
     ```
   - 环境切换：
     - **Mock环境**: 使用预定义的测试账户，无需真实后端服务
     - **开发环境**: 使用Better Auth服务进行开发和测试
     - **生产环境**: 使用Firebase Auth服务进行身份验证
   - 注意事项：
     - 所有认证服务实现相同的接口，确保代码在不同环境间的一致性
     - Mock环境提供完整的用户数据，便于测试各种场景
     - 生产环境应使用安全的认证服务，如Firebase Auth
     - 认证服务应与数据服务协同工作，确保用户数据的同步

4. **环境配置**：
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

5. **测试与调试**：
   - 测试离线场景：关闭网络连接并验证功能
   - 测试同步机制：模拟网络中断后恢复，观察数据如何在两个存储层之间同步
   - 使用 `DataServiceFactory.setUseMockData(true)` 强制使用模拟数据
   - 检查 `localStorage` 和 `IndexedDB` 中的数据（Web环境）
   - 监控同步操作和网络请求

### 编码指南

- [编码规范](./guides/coding-standards.md) - 编码规范与最佳实践
- [前端开发标准](./guides/frontend-development-standards.md) - 前端开发的标准和最佳实践
- [后端开发标准](./guides/backend-development-standards.md) - 后端开发的标准和最佳实践
- [性能优化](./guides/performance-optimization.md) - 性能优化指南
- [最佳实践](./guides/best-practices.md) - 项目开发的最佳实践

### 技术教程

#### 数据库相关
- [数据库最佳实践](./guides/lessons/database/best-practise.md) - 数据库设计与使用的最佳实践
- [Firebase初始化与回退机制](./guides/lessons/database/firebase-initialization-fallback.md) - Firebase服务连接失败时的处理方案

#### PWA相关
- [Progressive Web App开发指南](./guides/lessons/pwa/readme.md) - PWA开发的基础知识和实践

#### 脚本与环境
- [Windows兼容性注意事项](./guides/lessons/bash/windows-compatibility.md) - 在Windows环境下开发时的兼容性问题和解决方案

## 模板文档

- [应用发布工作流程](./guides/app-release-workflow.md) - 从开发完成到应用发布的完整流程
- [项目开发工作流程](./guides/project-development-workflow.md) - 项目开发的完整工作流程
- [UI素材管理指南](./guides/ui-assets-management.md) - UI设计稿素材管理的最佳实践
- [功能任务计划模板](./templates/feature-task-plan-template.md) - 功能任务计划模板
- [任务计划模板](./templates/task-plan-template.md) - 通用任务计划模板
- [原型到资源转换](./templates/prototype-to-assets.md) - 原型到资源的转换流程
- [脚本生成器模板](./templates/script-generator-template.md) - 脚本生成器模板

## 脚本工具

### 项目初始化与环境设置
- [项目初始化脚本](./bash-scripts/init-project.sh) - 自动化项目初始化流程
- [最小环境检查](./bash-scripts/check-minimal-env.sh) - 检查开发环境是否满足最低要求
- [环境检查脚本](./bash-scripts/check-environment.sh) - 全面检查开发环境配置
- [Python环境设置](./bash-scripts/setup-python-env.sh) - 配置Python开发环境
- [依赖安装脚本](./bash-scripts/install-dependencies.sh) - 自动安装项目依赖

### Git与版本控制
- [Git仓库初始化](./bash-scripts/init-git-repo.sh) - 初始化Git仓库并配置
- [代码提交脚本](./bash-scripts/commit-code.sh) - 标准化代码提交流程
- [项目状态检查](./bash-scripts/check-project-status.sh) - 检查项目当前开发状态

### 发布与部署
- [准备发布脚本](./bash-scripts/prepare-release.sh) - 准备应用发布
- [发布脚本](./bash-scripts/release.sh) - 执行应用发布流程
- [回滚脚本](./bash-scripts/rollback.sh) - 在发布失败时回滚到先前版本

### 文档与任务管理
- [文档索引创建](./bash-scripts/create-docs-index.sh) - 自动生成文档索引
- [任务脚本生成](./bash-scripts/generate-task-scripts.sh) - 根据模板生成任务脚本
- [任务计划转换](./bash-scripts/convert-task-plan.sh) - 将任务计划转换为执行脚本
- [任务执行脚本](./bash-scripts/execute-task.sh) - 执行预定义的任务

### 数据与同步
- [更新Trae规则](./bash-scripts/update-trae-rules.sh) - 更新API模拟规则
- [加载Trae规则](./bash-scripts/load-trae-rules.sh) - 加载预定义的API模拟规则
- [同步指南](./bash-scripts/sync-guidelines.sh) - 数据同步指南和自动化工具

## 任务计划与进度

- [项目进度报告](./tasks/project-progress.md) - 项目的当前进度和完成的任务
- [约会应用实现计划](./tasks/dating-app-implementation-plan.md) - 约会应用实现计划
- [约会应用实现进度](./tasks/dating-app-implementation-progress.md) - 约会应用实现进度
- [约会应用旅程测试](./tasks/dating-app-journey-test.md) - 约会应用用户旅程测试
- [数据库测试进度](./tasks/database-test-progress.md) - 数据库测试进度
- [数据库测试实施计划](./tasks/database-test-implementation-plan.md) - 数据库测试实施计划
- [数据库实施进度](./tasks/database-implementation-progress.md) - 数据库实施进度
- [数据库实施计划](./tasks/database-implementation-plan.md) - 数据库实施计划
- [数据库重构计划](./tasks/db-refactor-plan.md) - 数据库重构计划
- [Tinder应用初始计划](./tasks/tinder-app-starter-plan.md) - Tinder应用初始计划

## 常见问题 (FAQ)

### 项目设置与环境
**Q: 如何在本地模式和生产模式之间切换?**  
A: 修改环境变量 `NEXT_PUBLIC_DATABASE_ENV` 为 `mock`, `local` 或 `production`。详见[数据库环境配置](./guides/database-development-workflow-updated.md#环境配置)。

**Q: 我应该使用哪种Mock客户端来模拟数据?**  
A: 项目采用双存储模拟策略：
- 使用 `MockDatabaseClient`（内存/JSON模式）模拟**远程服务器数据存储**
- 使用 `MockIndexedDBClient`（fake-indexeddb）模拟**客户端本地离线存储**
这种策略反映了实际生产环境中的分层存储架构。

**Q: 如何在测试中同时使用这两种Mock存储?**  
A: 通过配置环境变量：
```bash
# Mock环境下同时使用两种存储
NEXT_PUBLIC_DATABASE_ENV=mock
NEXT_PUBLIC_MOCK_DB_TYPE=hybrid
NEXT_PUBLIC_USE_FAKE_INDEXEDDB=true
```
这会启用 `MockDatabaseClient` 作为主存储并使用 `MockIndexedDBClient` 作为离线缓存。

**Q: 移动端构建失败，如何解决?**  
A: 检查 Capacitor 配置和原生依赖，确保已运行 `npx cap sync`。查看[移动端故障排除](./guides/database-troubleshooting.md#移动平台问题)。

### 数据与同步
**Q: 离线模式下如何确保数据同步?**  
A: 系统使用离线优先策略，操作先存在本地，联网后自动同步。详见[数据同步机制](./guides/database-development-workflow-updated.md#同步策略)。

**Q: 如何处理同步冲突?**  
A: 项目使用最后写入者获胜策略，可通过 `syncConfig` 自定义冲突解决策略。详见[冲突解决](./guides/database-schema-design.md#同步配置)。

### 认证服务
**Q: 如何在不同认证服务之间切换?**  
A: 通过修改环境变量 `NEXT_PUBLIC_AUTH_SERVICE_TYPE` 为 `better`、`firebase` 或 `mock`。详见[认证服务开发](./guides/auth-service-development.md#环境切换)。

**Q: Mock认证服务有哪些预定义的测试账户?**  
A: Mock环境提供以下测试账户：
- 邮箱账户: `test@example.com:password123`, `admin@example.com:admin123`
- 手机账户: `+8613800138000:123456`, `+8613900139000:654321`
这些账户可以在 `.env.mock` 文件中配置。

**Q: 如何在开发过程中测试不同的认证场景?**  
A: 使用Mock认证服务可以快速测试各种场景：
- 正常登录流程
- 验证码发送和验证
- 登录失败处理
- 会话管理和登出
无需真实后端服务即可完成测试。

**Q: 生产环境应该使用哪种认证服务?**  
A: 推荐使用Firebase Auth服务，它提供：
- 完整的身份验证功能
- 高可用性和安全性
- 与Firebase其他服务的无缝集成
- 符合行业标准的安全实践

### 开发与调试
**Q: 如何测试不同的网络状态?**  
A: 使用 Chrome DevTools 中的网络条件模拟器或 `NetworkService.simulateOffline()`。

**Q: 如何查看应用中存储的数据?**  
A: Web 端可使用浏览器的 IndexedDB 调试工具，移动端可启用数据库检查器。详见[数据调试](./guides/database-troubleshooting.md#数据检查)。

## 工具与实用程序

- [项目工具使用指南](./guides/tools-usage-guide.md) - 项目相关工具的使用说明和最佳实践

## 贡献指南

我们欢迎并感谢所有形式的贡献。以下是参与项目的方法：

### 提交贡献流程

1. Fork 本仓库
2. 创建您的特性分支: `git checkout -b feature/amazing-feature`
3. 遵循[编码规范](./guides/coding-standards.md)开发功能
4. 提交您的更改: `git commit -m '添加某某功能'`
5. 推送到分支: `git push origin feature/amazing-feature`
6. 提交 Pull Request

### 报告问题

发现问题时，请在 issues 页面提交，并提供以下信息：
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、浏览器、设备等）
- 截图（如适用）

### 开发环境设置

详细环境设置请参考[项目初始化指南](./guides/project-initialization-guide.md)。

### 代码审核规范

- 所有提交必须通过自动化测试
- 代码风格必须符合项目规范
- 新功能需要包含相应的测试
- 文档更新应与代码变更保持一致

## 使用指南

### 一般指南

1. 在开始开发前，请先阅读[项目初始化指南](./guides/project-initialization-guide.md)和[开发流程指南](./guides/development-process-guide.md)
2. 创建新功能时，请使用[功能任务计划模板](./templates/feature-task-plan-template.md)
3. 开发代码时，遵循[编码规范](./guides/coding-standards.md)和[最佳实践](./guides/best-practices.md)
4. 提交代码时，请遵循[Git分支策略](./guides/git-branch-strategy.md)
5. 发布应用时，请遵循[应用发布工作流程](./guides/app-release-workflow.md)

### 数据与服务开发指南

1. **数据库开发**：
   - 项目采用分层存储架构：
     - **远程数据层**：使用服务器/云端存储（生产环境）或 MockDatabaseClient（开发环境）
     - **本地离线存储层**：使用 IndexedDB/SQLite（生产环境）或 MockIndexedDBClient（开发环境）
   - 从模拟(Mock)数据开始，逐步过渡到本地数据库，最后到生产环境
   - 确保同时测试在线和离线场景，验证数据同步机制
   - 遵循[数据库开发工作流程](./guides/database-development-workflow-updated.md)
   - 添加新数据表时，参考[添加新数据表](./guides/add-new-table.md)
   - 定义模式时确保包含合适的同步配置

2. **服务层开发**：
   - 使用单例模式和工厂模式
   - 实现离线支持和网络状态响应
   - 所有UI组件都应通过服务访问数据，而非直接访问数据库
   - 服务应抽象存储层细节，处理远程数据和本地缓存之间的转换和同步
   - 遵循[最佳实践](./guides/best-practices.md)中的服务层开发部分

3. **认证服务开发**：
   - 项目支持多种认证服务实现：
     - **Better Auth**: 自定义认证服务，支持邮箱和手机号登录
     - **Firebase Auth**: 基于Firebase的认证服务，提供完整的身份验证功能
     - **Mock Auth**: 用于开发和测试的模拟认证服务，提供预定义的测试账户
   - 认证服务配置：
     ```
     # 选择认证服务类型
     NEXT_PUBLIC_AUTH_SERVICE_TYPE=better|firebase|mock
     
     # Better Auth配置
     NEXT_PUBLIC_BETTER_AUTH_API_KEY=your_api_key
     NEXT_PUBLIC_BETTER_AUTH_API_URL=https://api.better-auth.com
     
     # Firebase Auth配置
     NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     
     # Mock Auth配置
     NEXT_PUBLIC_MOCK_AUTH_ENABLED=true
     NEXT_PUBLIC_MOCK_AUTH_USERS=test@example.com:password123,admin@example.com:admin123
     NEXT_PUBLIC_MOCK_AUTH_PHONES=+8613800138000:123456,+8613900139000:654321
     ```
   - 认证服务使用：
     ```typescript
     // 获取认证服务实例
     const authService = AuthServiceFactory.getInstance().getAuthService();
     
     // 邮箱登录
     const user = await authService.login('test@example.com', 'password123');
     
     // 手机号登录
     const user = await authService.loginWithPhone('+8613800138000', '123456');
     
     // 发送验证码
     await authService.sendVerificationCode('+8613800138000');
     
     // 获取当前用户
     const currentUser = authService.getCurrentUser();
     
     // 检查认证状态
     const isAuthenticated = authService.isAuthenticated();
     
     // 登出
     await authService.logout();
     ```
   - 环境切换：
     - **Mock环境**: 使用预定义的测试账户，无需真实后端服务
     - **开发环境**: 使用Better Auth服务进行开发和测试
     - **生产环境**: 使用Firebase Auth服务进行身份验证
   - 注意事项：
     - 所有认证服务实现相同的接口，确保代码在不同环境间的一致性
     - Mock环境提供完整的用户数据，便于测试各种场景
     - 生产环境应使用安全的认证服务，如Firebase Auth
     - 认证服务应与数据服务协同工作，确保用户数据的同步

4. **环境配置**：
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

5. **测试与调试**：
   - 测试离线场景：关闭网络连接并验证功能
   - 测试同步机制：模拟网络中断后恢复，观察数据如何在两个存储层之间同步
   - 使用 `DataServiceFactory.setUseMockData(true)` 强制使用模拟数据
   - 检查 `localStorage` 和 `IndexedDB` 中的数据（Web环境）
   - 监控同步操作和网络请求

### 自动化脚本使用

1. **项目设置**：
   ```bash
   # 初始化项目
   ./bash-scripts/init-project.sh
   
   # 安装依赖
   ./bash-scripts/install-dependencies.sh
   ```

2. **开发流程**：
   ```bash
   # Git操作
   ./bash-scripts/commit-code.sh "feat: 添加新功能"
   
   # 生成任务脚本
   ./bash-scripts/generate-task-scripts.sh -t "开发新功能"
   ```

3. **发布流程**：
   ```bash
   # 准备发布
   ./bash-scripts/prepare-release.sh v1.0.0
   
   # 执行发布
   ./bash-scripts/release.sh v1.0.0
   ```
