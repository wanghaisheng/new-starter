# phone 业务服务目录说明

本目录聚合了所有与手机硬件能力相关的业务服务，采用“接口+工厂+多实现”架构，支持 Web、原生 App（Capacitor）、Mock 多端统一调用。

## 1. 主要服务模块

- bluetooth/    蓝牙服务（详见 bluetooth/README.md）
- sensor/       传感器服务（详见 sensor/README.md）
- camera/       摄像头服务
- location/     定位服务
- nfc/          NFC服务
- ...

## 2. 结构约定

- 每类服务均有 types（接口定义）、adapters（多端实现）、factory（工厂）、service（业务聚合）、__tests__（单元测试）等子目录。
- 业务层仅依赖接口和工厂，不直接依赖具体实现。

## 3. 扩展与适配

- 支持 Web/Capacitor/Mock 三端自动适配。
- 如需特殊机型/品牌适配，可扩展 adapter 并在 factory 中注册。

## 4. 目录结构建议

```
phone/
├── bluetooth/                 # 蓝牙服务及文档
│   ├── README.md
│   └── ...
├── sensor/                    # 传感器服务及文档
│   ├── README.md
│   └── ...
├── camera/
├── location/
├── nfc/
├── factories/                 # 各类服务工厂
├── mocks/                     # Mock 实现
└── plugin-integration.md      # 插件能力与适配说明
```

## 5. 业务调用方式

业务层只依赖接口和工厂：

```typescript
const bluetooth = BluetoothServiceFactory.create();
await bluetooth.initialize();
if (await bluetooth.requestPermissions()) {
  // ...
}
```

---

- 各功能服务详细用法、兼容性说明、插件集成等请查阅各自子目录下的 README.md。
- 如需代码模板/工厂实现样例，或希望对现有服务文件进行具体重构，请查阅本目录相关实现或联系维护者。
