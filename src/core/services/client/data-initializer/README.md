# Client DataInitializer 说明

本模块负责“客户端本地环境下”的数据库初始化与数据导入，适配浏览器、移动端（如 Capacitor）、PWA 等场景。其设计原则、调用链与业务层/服务端的 DataInitializer 保持一致，唯一区别在于：**底层数据服务自动适配本地存储（如 IndexedDB、localStorage、Capacitor SQLite 等）**，屏蔽所有环境和实现细节。

---

## 1. 主要职责
- 检测并初始化本地数据库结构（IndexedDB/SQLite...）。
- 导入 mock、json、sql 等本地数据文件，支持首次初始化、重置、批量导入。
- 所有写入、建表、批量导入均通过仓储层（Repository）完成，保证类型安全和业务一致性。
- 适配多端（Web、移动端、PWA），自动选择合适的本地存储方案。

---

## 2. 设计原则
- **解耦**：初始化服务通过数据服务工厂/注册表获取已选好的本地数据服务实例（adapter），不直接操作底层数据库 client。
- **配置驱动**：自动读取环境变量（如 ENV_STAGE、DATA_MODE、OFFLINE_DB）决定初始化策略。
- **多数据源支持**：支持 memory、json、sql 等多种本地数据导入方式。
- **幂等性**：每次初始化前检测本地数据库是否已初始化，避免重复导入。

---

## 3. 典型用法
```typescript
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { UserRepository } from '@/core/lib/db/repositories/user.repository';
import { ClientDataInitializer } from './client-data-initializer';

const dataService = DataServiceRegistry.getInstance(); // 自动选择 IndexedDB/SQLite
const userRepository = new UserRepository(dataService);

await ClientDataInitializer.initialize({
  repositories: { userRepository },
  mockData: { users: mockUsers },
  // 其它参数如 env、mode ...
});
// 内部通过 userRepository.bulkInsert(mockUsers) 完成本地写入
```

---

## 4. 与业务/服务端 DataInitializer 的关系
- 设计模式、调用链、解耦原则完全一致。
- 区别仅在于：本模块专注于本地环境，所有数据服务 adapter 自动适配本地存储。
- 可与业务/服务端 DataInitializer 复用通用工具函数或基类。

---

## 5. FAQ
- **Q: 如何保证多端/多环境一致性？**
  - A: 所有 mock 数据、schema、初始化脚本集中管理，仓储层写入逻辑复用。
- **Q: 可以只初始化部分表/数据吗？**
  - A: 支持传入部分 mock/json/sql 数据，按需初始化。
- **Q: 支持哪些本地存储？**
  - A: IndexedDB、localStorage、Capacitor SQLite、memory 等，自动适配。

---

如需更多用法和扩展建议，请参考项目架构文档或联系架构负责人。
