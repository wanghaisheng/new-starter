# infrastructure 目录说明

本目录用于存放所有“基础设施层”相关的服务和适配器，属于 DDD 分层架构中的 Infrastructure 层。

> ⚠️ 本目录所有基础设施服务设计、分层架构、目录结构、注册表、mock/降级/环境切换、日志等规范请统一参考 [../service-design-guidelines.md](../service-design-guidelines.md)。
> 
> **服务运行模式（Service Modes）与 provider/adapter 类型适配规范请统一参考 [../../docs/guides/service-modes.md](../../docs/guides/service-modes.md)。**
> 
> - 基础设施服务需支持 online-only、offline-only、hybrid 三种模式，适配 mock、local、remote、hybrid-adapter 等多类型 provider。
> - 详细适配原则、环境变量建议、各开发阶段推荐模式详见 service-modes.md。
> - 如有特殊补充仅在此说明，其余请勿重复维护。

> ⚠️ 本目录环境模式与环境变量配置请统一参考 [../../../docs/guides/environment-modes.md](../../../docs/guides/environment-modes.md)。
> - 多环境适配、环境变量说明、配置示例详见 environment-modes.md。

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
