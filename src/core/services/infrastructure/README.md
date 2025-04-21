# infrastructure 目录说明

本目录用于存放所有“基础设施层”相关的服务和适配器，属于 DDD 分层架构中的 Infrastructure 层。

## 目录定位

- 主要负责与外部系统、第三方服务、平台能力的集成和适配。
- 与业务无关，专注于技术实现和环境抽象，为上层业务服务提供底层能力支撑。

## 典型内容

- 网络请求/连接（如 NetworkService、HttpClient、WebSocketProvider 等）
- 存储适配（如 IndexedDBProvider、LocalStorageAdapter、CacheProvider 等）
- 系统能力（如 FileSystemProvider、DeviceInfoProvider、PushProvider 等）
- 平台桥接（如 Capacitor、Electron、React Native 相关桥接层）
- 其他基础设施和工具类服务

## 推荐目录结构（对齐业务 provider 规范）

```
infrastructure/
  logger/
    adapters/           # 日志适配器（如 winston、mock）
    factory/            # 工厂方法，统一创建 logger 实例
    registry/           # 注册表，管理 logger 单例
    service/            # logger 服务实现
    types/              # logger 相关类型
    index.ts            # 统一导出
  network/
    adapters/
    factory/
    registry/
    service/
    types/
    index.ts
  email/
    adapters/
    factory/
    registry/
    service/
    types/
    index.ts
  config/
    adapters/
    factory/
    registry/
    service/
    types/
    index.ts
  types.ts              # 全局基础设施类型聚合
  README.md
```

## 组织与使用规范

- 每个基础设施 provider（如 logger/network/email/config）均采用 adapters/factory/registry/service/types/index.ts 结构，便于扩展和 mock。
- 业务层禁止直接 new/factory，统一通过 registry 获取服务实例。
- types.ts 只做类型聚合，不存具体实现。

## 主要服务说明

### NetworkService
- 路径：`network/network-service.ts`
- 用于统一处理 HTTP 请求、网络状态监听等。
- 支持 GET/POST/PUT/DELETE 等方法，支持拦截器与网络状态监听。
- 推荐通过 `NetworkService.getInstance()` 获取单例实例。

#### 用法示例：
```ts
import { NetworkService } from '@/core/services/infrastructure/network/network-service';
const networkService = NetworkService.getInstance();
const res = await networkService.get('/api/path');
```

### LoggerService
- 路径：`logger/logger-service.ts`
- 用于统一处理日志记录、日志级别管理等。
- 支持多种日志适配器，推荐通过 `LoggerService.getInstance()` 获取单例实例。

#### 用法示例：
```ts
import { LoggerService } from '@/core/services/infrastructure/logger/logger-service';
const loggerService = LoggerService.getInstance();
loggerService.log('info', 'Hello World!');
```

## 使用建议

- 业务服务通过依赖注入或工厂模式调用 infrastructure 层能力，避免直接依赖第三方库。
- infrastructure 层不应包含具体业务逻辑，只做技术抽象和环境适配。
- 便于未来迁移、替换、mock、测试和多端适配。

---

如需扩展新的基础设施服务，请优先在本目录实现并保持接口抽象。

> 文档更新时间：2025-04-18
