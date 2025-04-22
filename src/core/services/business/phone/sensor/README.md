# 传感器服务（sensor）插件式架构说明

## 1. 模块定位
- 提供 Web/Capacitor/Mock/品牌等多端传感器能力，支持插件式适配器注册、自动降级与多实例管理。
- 架构分层：接口（types）→ 适配器（adapters）→ 工厂（factory）→ 注册表（registry）→ 业务服务（service）→ hooks。

## 2. 主要接口与类型
- `ISensorService`：业务层统一依赖的服务接口。
- `ISensorAdapter`：适配器实现需实现此接口，支持 setConfig/dispose 等扩展。
- `SensorServiceType`：支持 web/capacitor/mock/huawei/xiaomi/自定义类型。

## 3. 工厂与注册表
- 工厂：`SensorServiceFactory.create(type)` 创建实例，支持 registerAdapter/getAdapter/registerAllAdapters。
- 注册表：`SensorServiceRegistry` 支持多环境多实例注册、插件式适配器注册与批量注册。

## 4. 典型用法
```typescript
SensorServiceRegistry.registerAllAdapters();
const sensor = SensorServiceRegistry.getInstance().createService({
  environment: 'production',
  name: 'default',
  type: 'capacitor',
  options: { brand: 'huawei' } // 新增：通过 options.brand 支持品牌差异化
});
await sensor.initialize();
```
或通过 hooks：
```typescript
const { sensor, isLoading, error } = useSensor({ provider: 'capacitor', brand: 'xiaomi' });
```

## 5. 插件式适配器扩展（推荐新版写法）
- 新增适配器需实现 ISensorAdapter，并通过工厂/注册表注册 provider 维度：
  ```ts
  SensorServiceFactory.registerAdapter('web', (options) => new WebSensorAdapter(options));
  SensorServiceFactory.registerAdapter('capacitor', (options) => new CapacitorSensorAdapter(options));
  // 品牌差异化通过 options.brand 传递
  ```

## 6. 自动降级机制
- 工厂/注册表均支持自动降级，mock/测试环境自动 fallback 到 mock 实现。
- 推荐通过 options.brand 区分品牌，provider 不再与品牌强绑定。

## 7. hooks 层规范
- 推荐所有页面/组件通过 hooks/useSensor 获取服务实例，禁止直接 new。
- hooks 返回值建议统一 loading/error/empty 状态。
- 支持传递 provider/brand 组合参数，如：
  ```ts
  const { sensor, isLoading, error } = useSensor({ provider: 'capacitor', brand: 'huawei' });
  ```

---
如需批量注册模板、适配器实现样例、自动降级/插件式注册最佳实践，请参考本目录或联系维护者。
