# 蓝牙服务（bluetooth）插件式架构说明

## 1. 模块定位
- 提供 Web/Capacitor/Mock/品牌等多端蓝牙能力，支持插件式适配器注册、自动降级与多实例管理。
- 架构分层：接口（types）→ 适配器（adapters）→ 工厂（factory）→ 注册表（registry）→ 业务服务（service）→ hooks。

## 2. 主要接口与类型

- `IBluetoothService`：业务层统一依赖的服务接口。
- `IBluetoothAdapter`：适配器实现需实现此接口，支持 setConfig/dispose 等扩展。
- `BluetoothServiceType`：支持 web/capacitor/mock/huawei/xiaomi/自定义类型，便于插件式扩展。

## 3. 工厂与注册表

- 工厂：`BluetoothServiceFactory.create(type)` 创建实例，支持 registerAdapter/getAdapter/registerAllAdapters。
- 注册表：`BluetoothServiceRegistry` 支持多环境多实例注册、插件式适配器注册与批量注册。
- 推荐在应用入口调用：
  ```ts
  import { BluetoothServiceRegistry } from './registry/bluetooth-service-registry';
  BluetoothServiceRegistry.registerAllAdapters();
  ```

## 4. 典型用法

```typescript
import { BluetoothServiceRegistry } from './registry/bluetooth-service-registry';
BluetoothServiceRegistry.registerAllAdapters();
const bluetooth = BluetoothServiceRegistry.getInstance().createService({
  environment: 'production',
  name: 'default',
  type: 'capacitor',
});
await bluetooth.initialize();
```

或通过 hooks：
```typescript
const { bluetooth, isLoading, error } = useBluetooth();
```

## 5. 插件式适配器扩展

- 新增适配器需实现 IBluetoothAdapter，并通过工厂/注册表注册：
  ```ts
  BluetoothServiceFactory.registerAdapter('huawei', () => new HuaweiBluetoothAdapter());
  BluetoothServiceRegistry.registerAdapter('huawei', () => BluetoothServiceFactory.create('huawei'));
  ```

## 6. 自动降级机制
- 工厂/注册表均支持自动降级，mock/测试环境自动 fallback 到 mock 实现。

## 7. hooks 层规范
- 推荐所有页面/组件通过 hooks/useBluetooth 获取服务实例，禁止直接 new。
- hooks 返回值建议统一 loading/error/empty 状态，便于页面友好渲染。

---
如需批量注册模板、适配器实现样例、自动降级/插件式注册最佳实践，请参考本目录或联系维护者。
