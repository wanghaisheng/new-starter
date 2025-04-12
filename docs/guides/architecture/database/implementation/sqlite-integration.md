# SQLite 数据库集成指南

本文档提供了有关如何在项目中使用 SQLite 数据库的详细指南，特别是通过 Capacitor SQLite 插件在移动应用中的使用方法。

## 概述

项目使用 Capacitor SQLite 插件在移动设备上提供本地存储能力。这种实现支持以下功能：

- 离线数据存储
- 数据同步
- 架构管理
- 加密支持

## 架构

SQLite 集成是项目数据层的一部分，它的架构如下：

```
src/core/lib/db/
├── clients/                     # 数据库客户端实现
│   ├── capacitor-sqlite/        # SQLite 客户端实现
│   │   ├── sqlite-client.ts     # SQLite 客户端
│   │   ├── sqlite-config.ts     # SQLite 配置
│   │   └── sqlite-mapper.ts     # SQLite 数据映射
├── datasources/                 # 数据源定义
│   ├── sqlite.datasource.ts     # SQLite 数据源配置
├── schema/                      # 架构定义
│   ├── types.ts                 # 架构类型
│   ├── schema-registry.ts       # 架构注册表
```

## 配置选项

SQLite 数据库支持多种配置选项，可以在 `src/core/lib/db/clients/capacitor-sqlite/sqlite-config.ts` 文件中设置：

### 基本配置

```typescript
const SQLITE_CONFIG: SQLiteConfig = {
  database: {
    name: 'heytcm_db',  // 数据库名称
    version: 1          // 数据库版本
  }
};
```

### 加密选项

SQLite 支持数据库加密（仅在原生平台上）：

```typescript
{
  encryption: {
    enabled: true,             // 启用加密
    key: 'your-secret-key'     // 加密密钥
  }
}
```

### 性能优化

```typescript
{
  performance: {
    enableWAL: true,          // 启用 WAL 模式
    syncMode: 'NORMAL'        // 同步模式：NORMAL, FULL, OFF
  }
}
```

### 调试设置

```typescript
{
  debug: {
    enableLogging: true,      // 启用 SQL 查询日志
    verboseErrors: true       // 记录详细错误信息
  }
}
```

## 使用方法

### 初始化数据库

要初始化 SQLite 数据库，请调用 `initializeSqliteDataSource` 函数：

```typescript
import { initializeSqliteDataSource } from '@/core/lib/db/datasources/sqlite.datasource';

async function initDatabase() {
  try {
    const dataSource = await initializeSqliteDataSource();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败', error);
  }
}
```

### 架构定义

项目使用集中式架构注册表来管理数据库表结构。所有表结构必须在应用启动时注册。

1. 首先，创建一个模式定义文件：

```typescript
// src/core/lib/db/schema/definitions/user-schema.ts
import { ColumnType, schemaRegistry } from '@/core/lib/db/schema';
import { SyncStrategy } from '@/core/lib/db/types/sync-flags';

// 定义用户表结构
schemaRegistry.register({
  name: 'user',
  columns: [
    { name: 'id', type: ColumnType.STRING, primaryKey: true },
    { name: 'username', type: ColumnType.STRING, nullable: false },
    { name: 'email', type: ColumnType.STRING, nullable: false },
    { name: 'created_at', type: ColumnType.DATETIME, nullable: false },
    { name: 'updated_at', type: ColumnType.DATETIME, nullable: false }
  ],
  indexes: [
    { name: 'idx_user_email', columns: ['email'], unique: true }
  ],
  syncConfig: {
    strategy: SyncStrategy.ONLINE_FIRST,
    offlineEnabled: true
  }
});
```

2. 确保在启动时加载所有模式：

```typescript
// 在应用入口文件
import { initializeSchemas } from '@/core/lib/db/schema';

// 初始化所有模式
initializeSchemas();
```

### 平台差异处理

SQLite 实现会根据运行平台自动调整其行为：

- **Web 平台**：使用 SQLite 的 Web 模式（基于 SQL.js）
- **Android/iOS**：使用原生 SQLite 实现
- **加密**：仅在原生平台上支持

这些差异由 `getAppPlatform()` 工具函数处理，该函数检测当前运行环境。

## 最佳实践

### 数据模型设计

1. **保持简单**：避免复杂的关系和连接，因为 SQLite 在复杂查询上性能可能受限
2. **适当索引**：为常用查询字段添加索引，但避免过度索引
3. **批处理操作**：大量操作时使用批处理和事务
4. **字段命名一致性**：使用一致的命名惯例（例如蛇形命名法 `user_id`）

### 离线数据处理

1. **冲突解决策略**：为每个实体类型定义明确的冲突解决策略
2. **同步优先级**：对不同类型的数据使用不同的同步策略：
   - 用户个人资料 -> 在线优先
   - 本地生成的内容 -> 离线优先
   - 配置数据 -> 在线只读

3. **版本控制**：为所有实体添加版本号字段，便于解决冲突

## 故障排除

### 常见问题

1. **初始化失败**

   ```
   错误: 无法初始化 SQLite 数据源: TypeError: Cannot read property 'execute' of undefined
   ```

   **解决方案**：确保 Capacitor SQLite 插件已正确安装，并在使用前添加平台：
   ```bash
   npm install @capacitor-community/sqlite
   npx cap sync
   ```

2. **Android 上的加密错误**

   ```
   错误: attempt to write a readonly database
   ```

   **解决方案**：检查 Android 权限，并确认设备支持 SQLCipher：
   ```xml
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   ```

3. **数据同步问题**

   **解决方案**：
   - 检查网络连接状态
   - 验证同步配置是否正确
   - 检查日志中的同步错误

### 调试技巧

1. **启用详细日志**：
   ```typescript
   // sqlite-config.ts
   debug: {
     enableLogging: true,
     verboseErrors: true
   }
   ```

2. **检查数据库文件**：
   - Android: `/data/data/your.app.package/databases/`
   - iOS: 使用 iTunes 文件共享或 Xcode 查看

3. **使用 SQLite 浏览器工具**：
   - 导出数据库文件
   - 使用 [DB Browser for SQLite](https://sqlitebrowser.org/) 打开

## 性能优化

1. **批量操作**：使用事务批量处理多个操作
2. **适当索引**：为频繁查询的字段创建索引
3. **避免嵌套循环**：在应用代码中处理关系，而不是依赖复杂的 SQL 连接
4. **使用 WAL 模式**：启用 Write-Ahead Logging 以提高并发性能

## 迁移与升级

当需要更改数据库结构时，需要执行迁移：

1. **定义版本升级**：
   ```typescript
   // src/core/lib/db/schema/versions.ts
   export const databaseVersions: DatabaseVersion[] = [
     {
       version: 1,
       changes: [
         // 初始架构
       ]
     },
     {
       version: 2,
       changes: [
         {
           table: 'user',
           action: 'addColumn',
           column: {
             name: 'avatar_url',
             type: ColumnType.STRING,
             nullable: true
           }
         }
       ]
     }
   ];
   ```

2. **增加数据库版本号**：
   ```typescript
   // sqlite-config.ts
   database: {
     name: 'heytcm_db',
     version: 2  // 递增版本号
   }
   ```

3. **测试迁移流程**，确保数据不会丢失

## 安全最佳实践

1. **敏感数据加密**：对敏感数据使用数据库加密
2. **输入验证**：避免 SQL 注入风险
3. **备份策略**：实现定期数据备份机制
4. **访问控制**：限制对数据库操作的直接访问

## 参考资源

- [Capacitor SQLite 插件文档](https://github.com/capacitor-community/sqlite)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [数据库加密指南](https://www.zetetic.net/sqlcipher/design/) 