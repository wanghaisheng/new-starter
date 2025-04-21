# 业务 Mock 服务目录

本目录用于集中管理业务 mock 数据服务、演示数据加载、测试用户等，统一为 hooks/service 层提供 mock 能力。

## 目录结构（重构后）

- `adapters/`   mock 数据适配器（MockDataServiceAdapter）
- `factory/`    工厂层，统一创建 mock 服务实例
- `registry/`   注册表/provider，统一获取实例
- `service/`    业务实现（MockDataService）
- `types/`      类型与接口
- `data/`       mock 业务数据与测试用户
- `load-demo-data.ts`  一键加载演示数据脚本
- `index.ts`    统一导出注册表/provider

## 用法示例

```ts
import { MockDataServiceRegistry } from '@/core/services/business/mock';
const service = MockDataServiceRegistry.getInstance();
```
或
```ts
const provider = MockDataServiceRegistry.getProvider();
```

## 设计原则
- 所有业务 hooks/service 必须通过注册表/provider 获取 mock 服务实例，禁止直接 new 或全局变量。
- 适配器层负责 mock 业务数据的底层实现，工厂层统一实例化，注册表层实现单例/provider。
- 支持自动降级，测试/开发环境自动使用 mock 实现。
- 类型与接口放在 types/，便于 decoupling 和扩展。
- 原始 mock-data-service.ts 已拆分归档，可安全删除。

## 迁移说明
- 原 dating-data.json/example-data.json 仅保留 data/ 目录下版本，根目录同名文件已删除。
- demo-users.ts 可根据实际用途迁移至 data/ 或保留。
- 业务逻辑、数据操作已迁移至 service/ 和 adapters/。

---
如需扩展 mock 业务能力，请参照 messages 业务目录结构与分层模式。
