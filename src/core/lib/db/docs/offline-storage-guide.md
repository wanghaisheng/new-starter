# 离线专用存储功能指南

## 概述

离线专用存储（Offline-Only Storage）允许开发者指定某些数据表仅在本地设备上存储，永不同步到云端。这对于以下场景特别有用：

- 用户隐私敏感数据（如草稿、个人笔记）
- 设备特定设置和偏好
- 临时缓存数据
- 不需要跨设备同步的大型本地数据

## 实现方式

离线专用存储通过在表结构定义中配置 `syncConfig.offlineOnly = true` 来实现。启用此标志后，系统会：

1. 在标记实体状态时自动将其设为"已同步"状态（实际上不会同步）
2. 同步管理器会跳过标记为离线专用的表
3. 同步客户端不会将这些实体添加到同步队列中

## 基本用法

### 1. 定义离线专用表结构

```typescript
import { schemaRegistry, TableSchema } from '../schema';
import { SyncPriority, ConflictResolution } from '../types/sync-flags';

// 定义离线专用表
const offlineNotesSchema: TableSchema = {
  name: 'offline_notes',
  // 关键配置：离线专用标志
  syncConfig: {
    enabled: true,  // 同步功能仍然需要启用
    offlineOnly: true,  // 离线专用标志
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    // 列定义...
  ]
};

// 注册表结构
schemaRegistry.register(offlineNotesSchema);
```

### 2. 使用仓储操作离线专用数据

```typescript
// BaseRepository 已经支持离线专用表的自动处理
// 无需额外代码，正常使用仓储方法即可

// 示例：创建一个离线笔记
const notesRepository = new NotesRepository(client);
const newNote = await notesRepository.create({
  title: "私人笔记",
  content: "这是一个仅存储在本地的笔记",
  tags: ["私人", "本地"]
});

// 所有CRUD操作都会自动处理离线专用逻辑
// 无需手动添加同步标记
```

## 高级用例

### 1. 混合存储模式

一些场景下，可能需要同一实体类型的某些实例离线存储，而其他实例需要同步：

```typescript
// 使用标签或元数据标记离线实例
const userNotesRepository = new UserNotesRepository(client);

// 创建需要同步的笔记
const sharedNote = await userNotesRepository.create({
  title: "共享笔记",
  content: "这个笔记会同步到云端",
  isOfflineOnly: false  // 自定义标记字段
});

// 创建离线专用笔记
const privateNote = await userNotesRepository.create({
  title: "私人笔记",
  content: "这个笔记仅保存在本地",
  isOfflineOnly: true   // 自定义标记字段
});

// 在仓储类中扩展同步逻辑处理
class UserNotesRepository extends BaseRepository<UserNote> {
  async markForSync(note: UserNote): Promise<void> {
    // 跳过标记为离线专用的实例
    if (note.isOfflineOnly) {
      return;
    }
    
    // 调用同步管理器处理需要同步的实例
    const syncManager = getSyncManager();
    await syncManager.markForSync(note, this.tableName);
  }
}
```

### 2. 自定义同步行为

对于特定用例，可能需要自定义离线专用表的行为：

```typescript
class CustomRepository extends BaseRepository<CustomEntity> {
  // 覆盖基类方法以添加自定义行为
  protected isOfflineOnly(): boolean {
    const schema = this.schemaRegistry.getSchema(this.tableName);
    
    // 基于业务逻辑或配置动态判断是否为离线专用
    const userPreference = getUserPreference('syncEnabled');
    
    // 如果用户禁用了同步或模式定义为离线专用，则返回true
    return !userPreference || !!schema?.syncConfig?.offlineOnly;
  }
}
```

## 服务模式与离线专用存储的关系

> 本节结合 [service-modes.md](../../../../../docs/guides/service-modes.md) 对三种服务模式下的离线专用存储、数据初始化与同步行为进行详细说明。

### 1. 三种模式下的行为差异

- **online-only（纯在线模式）**
  - 离线专用表依然仅存本地，不同步到云端。
  - 其它表正常走远程同步。
- **offline-only（纯离线模式）**
  - 所有表均仅本地存储，无任何同步行为。
  - 离线专用表与普通表行为一致，但语义上更强调“永不上传”。
- **hybrid（混合模式）**
  - 普通表本地+云端自动同步，断网自动降级本地。
  - 离线专用表始终仅本地，参与本地初始化，但永不进入同步队列。

### 2. 数据初始化与同步策略

- 数据初始化阶段（如首次安装/注册/切换账号），所有表（含 offlineOnly）均可通过本地脚本/工厂批量初始化。
- 离线专用表初始化后，直接标记为 `SYNCED`，同步管理器跳过。
- 普通表根据当前模式决定是否进入同步队列。

### 3. 配置与环境变量建议

- 推荐通过 `DATA_MODE`（或 `SYNC_MODE`）环境变量驱动同步管理器行为。
- 可通过统一 schema/表定义的 `syncConfig.offlineOnly` 字段声明离线专用表。
- 详细模式含义、provider 适配建议见 [service-modes.md](../../../../../docs/guides/service-modes.md)。

### 4. 场景举例

- 用户草稿、隐私便签等表建议始终加 `offlineOnly: true`，即使在 hybrid/online-only 模式下也绝不上传。
- 设备偏好、临时缓存等表可根据业务需求选择是否同步。

## 注意事项

1. **多设备一致性**：离线专用数据不会跨设备同步，用户在不同设备上会有不同的数据状态。
2. **数据备份**：考虑为离线专用数据提供导出/导入功能，确保用户更换设备时不会丢失数据。
3. **混合模式性能**：在混合模式下（同一表有部分同步、部分不同步的数据），可能需要添加额外索引来优化查询性能。
4. **数据安全**：虽然离线专用数据不会发送到服务器，但依然应考虑本地加密保护敏感信息。

## 示例应用场景

1. **个人笔记应用**：用户可选择哪些笔记保持私密（离线）或共享（同步）
2. **健康数据跟踪**：敏感健康指标保存在本地，统计汇总数据可选择性同步
3. **设备设置**：特定于设备的设置（如显示首选项）保存为离线专用
4. **学习应用**：学习进度同步，但练习答案和笔记保存在本地

## 问题排查

问题：实体应该是离线专用但仍被添加到同步队列
* 检查表结构定义中的 `syncConfig.offlineOnly` 是否正确设置为 `true`
* 确认 `syncConfig.enabled` 也设置为 `true`
* 验证 SchemaRegistry 是否已正确加载表定义

问题：离线专用数据被意外删除
* 检查是否有清理本地存储的逻辑
* 验证用户卸载/重装应用的行为是否保留数据 

> ⚠️ 离线专用存储相关的环境模式（mock、local、dev、prod）与环境变量、适配原则等请统一参考 [../../../../docs/guides/environment-modes.md](../../../../docs/guides/environment-modes.md)。
> 
> - 离线存储、同步、初始化等多环境适配原则详见 environment-modes.md。
> - 如有补充需求，请优先完善该文档。