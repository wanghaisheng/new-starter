# 数据库配置指南

本文档详细介绍了项目的数据库配置系统，包括配置结构、环境支持、以及开发者如何使用各种配置选项。

## 配置架构概述

数据库配置系统采用分层结构，提供了灵活且可扩展的方式来管理不同环境下的数据库配置。

### 核心文件

- **`src/core/lib/db/types/database.types.ts`**: 定义所有配置相关的类型和接口
- **`src/core/lib/db/config.ts`**: 提供实际的配置值和构建器
- **`src/core/lib/db/interfaces.ts`**: 导出配置类型供其他模块使用

### 配置层次结构

配置接口遵循以下层次结构：

1. **`HybridDatabaseConfig`**: 基础配置接口，包含引擎类型、同步和离线存储设置
2. **`DatabaseConfig`**: 扩展自`HybridDatabaseConfig`，添加数据库名称、版本和表结构

## 环境支持

系统自动根据当前环境提供相应的配置，支持以下环境：

- **开发环境(development)**: 使用内存数据存储，方便开发和调试
- **测试环境(test)**: 使用模拟的IndexedDB，适合运行测试用例
- **生产环境(production)**: 使用SQLite存储，提供稳定可靠的数据持久化

### 环境确定顺序

系统按以下优先级确定当前环境：

1. 环境变量 `NEXT_PUBLIC_DATABASE_ENV`
2. 环境变量 `NODE_ENV`
3. 默认值 `development`

## 使用配置系统

### 基本用法

大多数情况下，您只需要直接导入默认配置：

```typescript
import { config } from '@/core/lib/db/config';

// 使用默认配置
const databaseService = new DatabaseService(config);
```

### 自定义配置

如果需要在运行时调整配置，可以使用以下方法：

#### 1. 使用`createConfig`函数

```typescript
import { createConfig } from '@/core/lib/db/config';

const customConfig = createConfig({
  name: 'custom_database',
  engine: 'indexeddb',
  // 其他自定义选项...
});
```

#### 2. 使用配置构建器

```typescript
import { configBuilder } from '@/core/lib/db/config';

const customConfig = configBuilder
  .withName('custom_database')
  .withEngine('indexeddb')
  .withSync({
    enabled: true,
    strategy: 'periodic',
    interval: 120000
  })
  .build();
```

## 配置选项详解

### 基础选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `name` | string | 数据库名称 |
| `version` | number | 数据库版本号 |
| `engine` | DatabaseEngine | 数据库引擎类型 |
| `encryptionKey` | string? | 可选的加密密钥 |

### 同步选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `sync.enabled` | boolean | 是否启用同步 |
| `sync.strategy` | SyncStrategy | 同步策略: 'immediate', 'periodic', 'manual' |
| `sync.offlineOnly` | boolean? | 是否仅离线存储，不同步到云端 |
| `sync.interval` | number? | 同步间隔(毫秒) |
| `sync.retryAttempts` | number? | 同步失败重试次数 |
| `sync.retryDelay` | number? | 重试延迟(毫秒) |
| `sync.conflictResolution` | string? | 冲突解决策略 |

### 离线存储选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `offline.maxStorageSize` | number? | 最大存储大小(字节) |
| `offline.maxEntitiesPerTable` | number? | 每表最大实体数量 |
| `offline.compressionEnabled` | boolean? | 是否启用压缩 |
| `offline.encryptionEnabled` | boolean? | 是否启用加密 |

## 最佳实践

1. **环境变量控制**: 使用环境变量控制数据库环境，避免在代码中硬编码
   ```bash
   # 开发环境
   NEXT_PUBLIC_DATABASE_ENV=development
   
   # 测试环境
   NEXT_PUBLIC_DATABASE_ENV=test
   
   # 生产环境
   NEXT_PUBLIC_DATABASE_ENV=production
   ```

2. **优先使用构建器**: 当需要自定义配置时，优先使用构建器模式确保类型安全

3. **离线优先开发**: 开发时采用"离线优先"策略，确保应用在无网络环境下仍能正常工作

4. **多环境测试**: 在开发过程中测试不同环境配置，确保应用在各种情况下的稳定性

## 常见问题

### 如何切换数据库引擎?

```typescript
import { configBuilder } from '@/core/lib/db/config';

// 切换到IndexedDB
const indexedDBConfig = configBuilder
  .withEngine('indexeddb')
  .build();
```

### 如何调整同步策略?

```typescript
import { configBuilder } from '@/core/lib/db/config';

// 设置为立即同步
const realtimeConfig = configBuilder
  .withSync({
    enabled: true,
    strategy: 'immediate',
    conflictResolution: 'last-write-wins'
  })
  .build();
```

### 如何扩展配置系统?

如需添加新的配置选项，遵循以下步骤：

1. 在 `database.types.ts` 中扩展相关接口
2. 在 `config.ts` 中的 `DatabaseConfigBuilder` 类中添加新的方法
3. 更新这个文档以反映新的配置选项

## 高级用例

### 混合存储配置

对于需要同时使用本地存储和远程存储的高级用例，可以使用`HybridDatabaseClient`：

```typescript
import { HybridDatabaseClient } from '@/core/lib/db/clients/hybrid/hybrid-database-client';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { FirebaseClient } from '@/core/lib/db/clients/firebase/firebase-client';
import { configBuilder } from '@/core/lib/db/config';

// 创建本地客户端
const localClient = new IndexedDBClient({
  name: 'local_store',
  version: 1,
  engine: 'indexeddb',
  // 其他选项...
});

// 创建远程客户端
const remoteClient = new FirebaseClient({
  name: 'cloud_store',
  version: 1,
  engine: 'firebase',
  // 其他选项...
});

// 创建混合客户端配置
const hybridConfig = configBuilder
  .withEngine('hybrid')
  .withSync({
    enabled: true,
    strategy: 'periodic',
    interval: 60000,
    localClient,
    remoteClient,
    syncIntervalMs: 60000
  })
  .build();

// 创建混合客户端实例
const hybridClient = new HybridDatabaseClient(hybridConfig);
await hybridClient.initialize();
```

### 混合存储最佳实践

使用混合存储方案时，请考虑以下最佳实践：

1. **明确定义同步策略**：根据数据敏感性和实时性要求选择适当的同步策略
   - `periodic`: 定期同步，适合非关键数据
   - `immediate`: 立即同步，适合重要交互数据
   - `manual`: 手动同步，适合大型数据集或带宽敏感场景

2. **处理同步冲突**：使用 `conflictResolution` 选项指定冲突解决策略
   - `client-wins`: 本地数据优先
   - `server-wins`: 远程数据优先
   - `last-write-wins`: 最后写入者优先

3. **隔离关键路径**：对于关键用户交互，应确保即使在同步操作失败时也能正常工作

4. **监控同步状态**：通过日志或用户界面元素让用户了解同步状态

```typescript
// 监听同步状态
hybridClient.onSyncStatusChange((status) => {
  console.log(`同步状态: ${status.isSyncing ? '正在同步' : '空闲'}`);
  console.log(`待同步项目: ${status.pendingChanges}`);
  console.log(`上次同步: ${new Date(status.lastSyncTimestamp).toLocaleString()}`);
});

// 手动触发同步
await hybridClient.manualSync();
``` 