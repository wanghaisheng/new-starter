# 数据库架构与实现指南

## 1. 架构概述

项目采用分层架构设计，支持多环境数据存储和同步：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现（底层连接与原生 API 封装）
│   ├── capacitor-sqlite/  # 移动端SQLite，封装 Capacitor SQLite 原生 API
│   ├── indexeddb/        # Web端IndexedDB，封装 IndexedDB 原生 API
│   ├── mock/            # Mock环境实现
│   │   └── indexeddb-client.ts  # Mock IndexedDB
│   └── base-client.ts    # 基础客户端抽象（定义统一连接/操作接口）
├── repositories/     # 数据访问层，聚合/复用 clients，实现业务数据访问
├── schema/          # 数据模型定义
└── types/           # 类型定义，**唯一类型出口和入口**，统一导出所有数据库相关类型，避免命名冲突，便于全局一致引用

```

> **架构原则：**
> - 所有底层数据库连接与原生 API 封装均放在 `clients/` 目录，按平台/类型分子目录实现。
> - `clients/` 只负责连接、基础 CRUD、事务、原生操作等，不涉及业务逻辑。
> - `repositories/` 负责聚合/复用 clients，封装业务相关的数据访问逻辑。
> - `types/` 目录作为**类型统一出口和入口**，所有类型定义、导出、全局访问均通过 `types/index.ts` 实现，避免命名冲突与重复定义，保证类型一致性和可维护性。
> - **注意：数据服务（如统一数据访问/业务聚合服务）已迁移至 db 目录外部，db 目录仅聚焦于底层存储与类型定义。**

## 2. 存储策略（最新实现说明）

### 2.1 存储类型与动态支持
- 所有支持的数据库类型通过 `types/database.types.ts` 中 `SUPPORTED_STORAGE_TYPES` 和 `SUPPORTED_OFFLINE_STORAGE_TYPES` 统一管理，避免硬编码。
- 在线存储类型：`memory`、`indexeddb`、`sqlite`、`postgres`
- 离线存储类型：`memory`、`indexeddb`、`sqlite`
- 类型定义：
  - `StorageType`、`OfflineStorageType`、`StorageConfig`、`OfflineStorageConfig` 详见 types 目录

### 2.2 配置与环境切换
- 配置加载与校验全部由 `config-loader.ts` 统一实现，支持环境变量动态切换（如 ONLINE_STORAGE_TYPE、OFFLINE_STORAGE_TYPE、DB_HOST 等）
- `DatabaseConfig` 类型结构已统一，所有配置均通过 `defaultConfig` 动态生成，避免类型冲突与冗余
- 离线存储类型校验严格依赖 `SUPPORTED_OFFLINE_STORAGE_TYPES`，如需扩展仅需维护类型常量

### 2.3 配置示例
```typescript
import { defaultConfig, SUPPORTED_STORAGE_TYPES, SUPPORTED_OFFLINE_STORAGE_TYPES } from './types/database.types';

// 通过 config-loader 自动加载并校验
const config = await ConfigLoader.loadConfig();

console.log(config.storage.online.type); // 取值范围受 SUPPORTED_STORAGE_TYPES 控制
console.log(config.storage.offline.type); // 取值范围受 SUPPORTED_OFFLINE_STORAGE_TYPES 控制
```

### 2.4 配置扩展与维护
- 新增数据库类型仅需在 `SUPPORTED_STORAGE_TYPES`/`SUPPORTED_OFFLINE_STORAGE_TYPES` 添加，无需修改业务代码
- 所有类型定义与校验逻辑集中于 types 层，业务逻辑与类型解耦，维护成本低

### 类型统一出口和入口的作用
- 所有数据库相关类型（如 StorageType、DatabaseConfig、实体类型等）都在 `types/` 目录集中定义与导出，**唯一入口为 `types/index.ts`**。
- 这样可以：
  - 保证全局类型一致性，避免不同模块引用不同版本的类型或命名冲突
  - 便于 IDE 智能提示和类型跳转，提升开发体验
  - 新增/修改类型时只需在 types 层维护，业务层零感知
  - 解决大型项目中类型分散导致的维护困难和隐式 bug
- 推荐所有类型引用都通过 `import { ... } from '@/core/lib/db/types'`，而非直接引用单个类型文件。

## 3. 数据同步与升级机制

- 同步策略、冲突解决、离线优先等均通过类型安全的配置项实现，详见 `DatabaseConfig.sync` 字段
- 数据库升级、表结构变更等通过 schema 目录集中管理

## 4. 目录结构（补充说明）

- `clients/`：支持多种数据库后端（mock、indexeddb、sqlite、postgres、firebase、supabase 等），每种类型独立子目录实现，便于扩展
- `repositories/`：所有数据访问逻辑通过仓库层聚合，支持多数据源切换
- `types/`：所有类型定义、支持类型统一导出，便于全局引用
- `config-loader.ts`：唯一配置加载入口，保证类型一致性和校验

## 5. 配置与类型变更注意事项
- 任何数据库类型、配置项扩展，均需优先在 types 层维护，业务层无需关心类型细节
- 推荐所有新表、字段、同步策略等均通过类型与 schema 机制声明，避免魔法字符串和硬编码

---

> 本文档已同步最新代码结构和类型实现，确保开发与维护一致性。

## 6. 平台特定实现

### 6.1 Web 平台 (IndexedDB)
- 使用 IndexedDB 作为主要存储
- 支持事务和索引
- 异步操作处理

### 6.2 移动平台 (SQLite)
- 使用 Capacitor SQLite 插件
- 原生性能优化
- 文件系统集成

### 6.3 混合存储策略
- 主存储选择
- 备份存储机制
- 数据同步协调

## 7. 错误处理与日志

### 7.1 错误处理策略
```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// 错误处理示例
try {
  await database.operation();
} catch (error) {
  if (error instanceof DatabaseError) {
    // 处理已知错误
  } else {
    // 处理未知错误
  }
}
```

### 7.2 日志记录
- 操作日志
- 错误日志
- 性能日志

## 8. 最佳实践

### 8.1 数据模型设计
```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  birthDate?: Date;
}
```

### 8.2 性能优化
- 批量操作支持
- 缓存策略
- 延迟加载

## 9. 开发流程

1. **环境设置**
   ```bash
   # 开发环境（Mock数据）
   bun run dev
   
   # 本地数据库环境
   bun run dev --env-file=.env.local
   
   # 生产环境
   bun run build
   bun run start
   ```

2. **添加新表**
   - 定义表结构
   - 创建仓库类
   - 实现同步逻辑

3. **测试验证**
   - 单元测试
   - 同步测试
   - 性能测试

## 10. 注意事项

1. **数据一致性**
   - 使用事务
   - 冲突解决
   - 数据备份

2. **性能考虑**
   - 合理索引
   - 数据分页
   - 查询优化

3. **安全性**
   - 数据加密
   - 访问控制
   - 安全审计

## 11. 常见问题

1. **离线数据同步**
   - 同步队列
   - 断点续传
   - 网络异常处理

2. **数据迁移**
   - 版本控制
   - 向后兼容
   - 数据验证

3. **性能优化**
   - 缓存策略
   - 批量操作
   - 延迟加载

## 12. 构建与部署

### 12.1 构建脚本
```json
{
  "scripts": {
    "build:web": "next build",
    "build:ios": "next build && npx cap sync ios",
    "build:android": "next build && npx cap sync android",
    "ios:start": "npm run build:ios && npx cap open ios",
    "android:start": "npm run build:android && npx cap open android"
  }
}
```

### 12.2 平台特定配置
- iOS 安全区域适配
- Android 权限管理
- Web 缓存策略
