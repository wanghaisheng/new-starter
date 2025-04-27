# phone 业务服务目录说明

本目录聚合了所有与手机硬件能力相关的业务服务，采用“接口+适配器+工厂+注册表”插件式架构，支持 Web、原生 App（Capacitor）、Mock 多端统一调用和自动降级。

## 1. 主要服务模块

- bluetooth/    蓝牙服务（详见 bluetooth/README.md）
- sensor/       传感器服务（详见 sensor/README.md）
- camera/       摄像头服务
- location/     定位服务
- nfc/          NFC服务
- ...

## 2. 结构约定
- 每类服务均有 types（接口定义）、adapters（多端实现）、factory（工厂）、registry（注册表）、service（业务聚合）、__tests__（单元测试）等子目录。
- 业务层仅依赖接口和工厂/注册表，不直接依赖具体实现。

## 3. 插件式注册与自动降级
- 工厂和注册表均支持 registerAdapter/getAdapter/registerAllAdapters 插件式扩展。
- 推荐所有页面/组件通过 hooks 获取服务实例，禁止直接 new。
- Mock/测试环境下自动降级到 mock 实现，生产环境优先 remote/原生。

## 4. 目录结构建议
```
phone/
├── bluetooth/                 # 蓝牙服务及文档
│   ├── README.md
│   ├── factory/               # 插件式工厂
│   ├── registry/              # 多实例注册表
│   ├── types/                 # 接口与类型定义
│   └── ...
├── sensor/                    # 传感器服务及文档
│   ├── README.md
│   └── ...
├── camera/
├── location/
├── nfc/
├── plugin-integration.md      # 插件能力与适配说明
└── ...
```

## 5. 业务调用方式

业务层只依赖接口和工厂/注册表：

```typescript
import { BluetoothServiceRegistry } from './bluetooth/registry/bluetooth-service-registry';
BluetoothServiceRegistry.registerAllAdapters();
const bluetooth = BluetoothServiceRegistry.getInstance().createService({
  environment: 'production',
  name: 'default',
  type: 'capacitor',
});
await bluetooth.initialize();
if (await bluetooth.requestPermissions()) {
  // ...
}
```
或通过 hooks：
```typescript
import { useBluetooth } from '@/core/hooks/useBluetooth';
import { useCamera } from '@/core/hooks/useCamera';
import { useLocation } from '@/core/hooks/useLocation';
import { useNFC } from '@/core/hooks/useNFC';
import { useSensor } from '@/core/hooks/useSensor';

const { bluetooth, isLoading, error, empty } = useBluetooth();
const { camera } = useCamera();
const { location } = useLocation();
const { nfc } = useNFC();
const { sensor } = useSensor();
// ...
```

- 推荐所有页面/组件通过 hooks 获取服务实例，禁止直接 new 或 ServiceFactory.create，便于统一异常处理、mock/brand/remote 自动降级。
- hooks 返回值统一包含 loading、error、empty 状态，便于页面友好渲染和异常提示。
- 可通过 type 参数灵活切换 mock/web/capacitor/品牌适配器。

## 6. 适配器扩展与插件式注册

每个服务均支持插件式批量注册适配器：
```typescript
BluetoothServiceFactory.registerAdapter('huawei', () => new HuaweiBluetoothAdapter());
CameraServiceFactory.registerAdapter('xiaomi', () => new XiaomiCameraAdapter());
// ...
```
- registerAllAdapters 方法已批量注册 mock/web/capacitor，支持品牌/扩展适配器。
- 适配器需实现标准 Adapter 接口（如 IBluetoothAdapter、ICameraAdapter 等），支持 setConfig/dispose。

## 7. 推荐最佳实践

- 业务层只依赖接口和 hooks，禁止直接 new Service。
- hooks/use[Service] 建议统一 loading/error/empty 状态，补充异常处理和组合扩展能力。
- adapters/ 目录下如需品牌/remote 适配器可补充骨架。
- __tests__ 目录建议为所有服务补全适配器/工厂/注册表单元测试。
- hooks/README.md 建议补充典型用法和最佳实践说明。

## 8. 服务注册表 getProvider 统一规范

所有 Registry 的 `getProvider` 方法应采用如下统一签名：

```typescript
getProvider(
  type: string,         // mock/remote/hybrid/brandA/brandB 等服务类型
  name?: string,        // 实例名，默认 'default'
  dataService?: any,    // 可选，部分服务如 Match 需注入数据服务
  options?: object      // 其它扩展参数，预留
): () => IService
```

- 推荐统一调用体验，便于 hooks 泛型化和批量重构。
- 详见[服务架构统一规范](../../../../docs/guides/architecture/services/overview.md)。

---
- 各功能服务详细用法、插件注册、自动降级等请查阅各自子目录下的 README.md。
- 如需代码模板/工厂/注册表实现样例，或希望对现有服务文件进行具体重构，请查阅本目录相关实现或联系维护者。
