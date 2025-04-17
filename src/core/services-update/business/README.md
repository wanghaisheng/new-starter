# 业务服务层（business）目录结构与用法说明

本文件夹聚合了新架构下所有核心业务服务，采用工厂（Factory）、适配器（Adapter）、注册表（Registry）等模式，支持多实现、可扩展、易测试。

---

## 目录结构说明

```
services-update/business/
├── app-service.ts           # 新架构统一入口服务（全局初始化/管理）
├── app-service-init.ts      # 入口初始化脚本及热更新逻辑
├── types.ts                 # 通用类型定义
├── auth/                    # 认证服务相关（工厂、适配器、类型等）
├── user/                    # 用户服务相关
├── match/                   # 匹配服务相关
│   ├── adapters/            # 多种业务实现（mock/remote/hybrid/品牌定制等）
│   ├── factory/             # 工厂，负责实例创建
│   ├── registry/            # 注册表，支持动态注册/查找
│   ├── types/               # 类型接口定义
│   ├── utils/               # 通用聚合/过滤/排序/分组等工具函数
│   └── ...                  # 其它业务相关文件
├── messages/                # 消息服务相关
│   ├── adapters/            # 多种业务实现（mock/remote/hybrid/advanced-hybrid）
│   ├── factory/             # 工厂，负责实例创建
│   ├── registry/            # 注册表，支持动态注册/查找
│   ├── types/               # 类型接口定义
│   └── ...                  # 其它消息服务相关文件
├── phone/                   # 端能力适配与远程配置
├── tests/                   # 业务服务单元测试
```

- 每个子目录下通常包含：
  - `factory/`    工厂，负责实例创建和依赖注入
  - `adapters/`   具体实现（Mock、Remote、Hybrid、品牌定制等）
  - `registry/`   注册表，支持多 provider 动态注册
  - `types/`      类型接口定义
  - `utils/`      通用聚合/过滤/排序/分组等工具函数，便于 adapter 复用
  - `service/`    （如有）聚合型/领域业务服务

---

## Adapter（适配器）多实现说明

业务服务通常需要多种 Adapter 实现，以适应不同业务场景：

- **Mock Adapter**：全部走本地数据服务，适合开发、测试和自动化场景。
- **Remote Adapter**：全部走远程 API，适合生产环境或需要服务端聚合的场景。
- **Hybrid Adapter**：本地优先，必要时远程同步，适合离线优先或弱网环境。
- **品牌定制/插件 Adapter**：针对不同品牌、A/B 测试、插件等场景可实现特殊业务规则。

Adapter 通过实现统一的业务服务接口（如 IMatchService），屏蔽底层数据来源和聚合逻辑，便于灵活切换与扩展。

---

## 通用聚合与工具函数（utils）最佳实践

- 将通用业务聚合、过滤、排序、分组等逻辑沉淀到 `utils/` 层（如 `match/utils/match-aggregation-utils.ts`），所有 Adapter 可直接复用。
- Adapter 层只需关注差异化业务逻辑（如品牌定制、特殊过滤、远程/本地混合等），无需重复实现通用操作。
- 推荐将所有可复用的聚合/筛选/分组/排序等函数沉淀为工具函数，提升代码复用率和可维护性。
- 典型工具函数包括：`getUserRelatedMatches`、`getMatchedUsers`、`filterMatchesByField`、`sortMatchesByFieldAsc/Desc`、`groupMatchesByField` 等。

---

## 消息服务（Message Service）架构与集成说明

### 1. 架构概述

- 消息服务采用“接口+适配器+工厂+注册表”分层设计，支持 mock、remote、hybrid、advanced-hybrid 等多种实现。
- 推荐所有前端、后端、API 层均通过业务服务接口（如 IMessageService）访问消息能力，彻底解耦具体实现。
- remote/advanced-hybrid 适配器的远程部分自动通过 fetch/axios 调用 API Router（如 /api/mobile/v1/messages），API Router 再调用服务端业务服务，保证安全、扩展性与一致性。
- 业务服务层聚焦于业务聚合与流程，所有数据流转、断网缓存、同步、事件监听等高级体验由适配器自动管理。

### 2. 推荐集成方式

- **前端/客户端**：通过工厂获取业务服务实例（如 MessageServiceFactory.createService('advanced-hybrid')），所有消息流操作（拉取、发送、监听、批量等）均通过业务服务接口调用。
- **适配器选择**：hybrid/advanced-hybrid 适配器自动支持本地缓存、断网缓存、自动同步、事件驱动等能力，remote 适配器则只负责 API 调用。
- **API Router**：作为所有远程数据流的唯一入口，负责鉴权、风控、事务、日志等安全与治理能力。remote/advanced-hybrid 适配器的远程部分自动调用 API Router，无需前端手动 fetch。
- **服务端业务服务**：API Router 只依赖业务服务接口（如 IMessageService），不关心具体实现，便于后续服务端升级与扩展。

### 3. 典型调用链

```
前端/remote-adapter/hybrid-adapter
  → fetch/axios
    → API Router (/api/mobile/v1/messages)
      → 服务端业务服务（如 MessageService）
        → 数据服务（如 IDataService）
```

### 4. 设计原则补充

- **安全优先**：所有远程数据流都必须经过 API Router，不能直接暴露业务服务实例。
- **体验优先**：hybrid/advanced-hybrid 适配器自动管理断网缓存、同步、事件驱动，提升消息流畅性和实时性。
- **多端一致**：所有端统一走接口和 API Router，便于多端协作和维护。
- **易扩展、易测试**：新增适配器、mock、品牌定制等只需实现接口并注册到工厂/注册表。

### 5. 推荐最佳实践

- 前端、服务端、API 层均只依赖接口和工厂，不直接依赖具体实现。
- 统一通过 app-service.ts 管理全局服务生命周期。
- 新增业务服务时，建议先定义类型接口，再实现适配器、注册表和工厂。
- 工具型通用逻辑沉淀到 utils 层，adapter 只关注差异化业务。
- 所有消息流相关逻辑建议迁移到业务服务接口和适配器调用，弃用手动 fetch API。

---

## 新业务服务目录组织规范（2025版）

为提升可维护性、横向扩展能力和团队协作，所有新建业务服务建议采用如下分层目录结构：

```
<service-name>/
├── adapters/         # 具体实现（如 web/remote/capacitor/mock/品牌定制等）
│   ├── web-xxx-adapter.ts
│   ├── capacitor-xxx-adapter.ts
│   ├── mock-xxx-adapter.ts
│   └── ...
├── factory/          # 工厂，负责实例创建与环境分发
│   └── <service-name>-service-factory.ts
├── service/          # 业务层聚合与唯一对外出口
│   └── <service-name>-service.ts
├── types/            # 统一接口与类型定义
│   └── <service-name>-service.ts
├── registry/         # （如有）多实现注册表
├── utils/            # （如有）通用工具函数
└── ...
```

### 适用场景举例
- 蓝牙服务 bluetooth/
- 摄像头服务 camera/
- 支付服务 payment/
- 传感器服务 sensor/
- 定位服务 location/

### 设计要点
- **adapters/** 只负责具体平台/环境实现，业务层不直接依赖
- **factory/** 统一分发，业务层只需通过工厂获取实例
- **service/** 聚合所有能力，对外暴露唯一服务类，内部自动选择合适 adapter
- **types/** 统一接口与类型出口，便于团队协作
- 结构与 payment、camera、bluetooth 等保持一致，便于横向扩展

### 业务调用方式
```typescript
import { BluetoothService } from './bluetooth/service/bluetooth-service';
const bluetooth = new BluetoothService();
await bluetooth.initialize();
if (await bluetooth.requestPermissions()) {
  // ...
}
```

---

> 所有新服务均建议严格按上述分层组织，便于后续维护、Mock/插件扩展、单元测试和多端适配。

---

## 用法示例

### 1. 统一初始化（入口）

```typescript
import { initAppService } from '@/core/services-update/business/app-service-init';
initAppService();
```

### 2. 获取具体业务服务

```typescript
import { DataServiceFactory } from '@/core/services-update/data/factory/data-service-factory';
import { MatchServiceFactory } from './match/factory/match-service-factory';

const dataService = DataServiceFactory.createService({ ... });
const matchServiceType = process.env.NEXT_PUBLIC_MATCH_SERVICE_ENV || 'mock';
const matchService = MatchServiceFactory.createService(matchServiceType, dataService);
```

### 3. 业务服务聚合调用

```typescript
// 以 Match 为例
const matches = await matchService.getMatchesByUserId(userId);
```

---

## 设计原则

- **解耦**：业务聚合与数据存储/端能力彻底解耦，业务服务层只依赖数据服务接口（IDataService），无需关心底层数据的具体实现。
- **可扩展**：适配器/工厂/注册表可轻松扩展新实现，支持 mock、remote、hybrid、品牌定制等多种业务场景。
- **可测试**：Mock 适配器便于单元测试。
- **配置驱动**：通过配置/环境变量灵活切换实现，推荐在 AppService 层统一读取配置/环境变量，然后作为参数注入到业务服务工厂，业务服务工厂本身不直接依赖环境变量。
- **关注点分离**：数据服务已封装所有底层细节，业务服务层聚焦于业务聚合与流程，无需再关心数据适配器的具体类型。
- **工具化**：通用聚合、过滤、排序、分组等业务逻辑沉淀到 utils 层，adapter 只关注差异化业务，提升复用性和维护性。

---

## 推荐实践

- 业务服务只依赖接口和工厂，不直接依赖具体实现。
- 统一通过 `app-service.ts` 管理全局服务生命周期。
- 新增业务服务时，建议按上述目录规范组织。
- 所有扩展建议先定义类型接口，再实现适配器、注册表和工厂。
- 业务服务工厂支持 type 参数，type 来源由上层（如 AppService、入口脚本、全局配置）统一决定和注入，实现“全局自动切换”，但工厂本身不直接读取环境变量。
- Adapter 层可根据业务需求灵活实现 mock、remote、hybrid、品牌定制等多种聚合逻辑，便于测试、扩展和多端适配。
- 通用聚合/过滤/排序/分组等逻辑建议沉淀为工具函数，所有 Adapter 直接复用。

---

如需更多示例、最佳实践或遇到集成问题，请查阅各子目录 README 或联系架构负责人。