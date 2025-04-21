# 项目架构总览

## 一、分层设计与核心模块

- **前端层**（Web/移动端）
  - 页面（app/web、app/mobile）
  - 组件（src/core/components、src/web/components、src/mobile/components）
  - 状态管理（src/core/store、React Context+Hooks）
  - 路由与导航（Next.js App Router、移动端自定义导航）

- **服务层**
  - 业务服务（src/core/services/business）：如UserService、MessageService、QuizService等，负责业务逻辑与数据流转
  - 数据服务（src/core/services/data）：数据持久化、API请求、缓存、同步等
  - 基础设施服务（src/core/services/infrastructure）：如网络、存储、第三方集成

- **Hooks层**
  - 业务逻辑复用（src/core/hooks）：如useUser、useMatches、useMessages、useQuiz等，统一数据获取、变更与状态管理

- **数据库/存储层**
  - Web端：IndexedDB（src/core/lib/db/clients/indexeddb）
  - 移动端：SQLite（src/core/lib/db/clients/capacitor-sqlite）
  - Mock/测试：fake-indexeddb、MockDatabaseClient
  - 云端：Firebase/Supabase等（预留）

- **API层**
  - Next.js API路由（app/api/）
  - 移动端API适配与同步（app/api/mobile/、src/core/services/mobile/）

- **插件与适配层**
  - Capacitor插件集成（capacitor/、capacitor.config.ts、src/core/services/mobile/）
  - 插件如Filesystem、Camera、Storage、Device、Geolocation等

## 二、主要技术栈
- Next.js 15.x、React 18.x、TailwindCSS 3.x
- TypeScript 5.x、Jest/Vitest、React Testing Library、Storybook
- Capacitor 5.x（移动端）、IndexedDB/SQLite

## 三、数据流与协作关系
- 页面与组件通过hooks访问业务服务，统一管理loading/error/empty等状态
- 服务层负责业务逻辑、数据同步与API通信
- 存储层支持多端数据持久化与同步
- 插件层适配硬件/原生能力，统一接口供业务调用
- 测试与Mock机制支持端到端流程验证

## 四、协作与扩展性设计
- 采用绝对路径@/导入，提升可维护性
- 各层职责分明，便于多人并行开发与新需求扩展
- 支持Mock/测试环境自动降级，保障开发效率与测试覆盖

如需详细了解某一层实现或具体模块，请查阅src/core/services、src/core/hooks、docs/guides/architecture等相关文档。
