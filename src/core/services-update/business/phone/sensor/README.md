# 传感器服务（SensorService）用法与兼容性说明

## 1. 能力概览
- 支持 iPhone/iOS 主流传感器类型：
  - accelerometer（加速度）
  - gyroscope（陀螺仪）
  - magnetometer（磁力计/指南针）
  - light（环境光，部分机型支持）
  - proximity（距离传感器，仅通话场景有限）
  - orientation（方向）
  - stepCounter（计步，仅原生可用）
- 提供 Web、Capacitor、Mock 三种实现，自动工厂分发。

## 2. 业务调用示例
```typescript
const sensor = new SensorService();
if (sensor.isAvailable('accelerometer')) {
  sensor.on('data', (data) => {
    // data: { type, timestamp, values }
  });
  sensor.start('accelerometer');
} else {
  // 降级处理
}
```

### 多类型并发监听
```typescript
sensor.start('accelerometer');
sensor.start('gyroscope');
// 均可通过 on('data', handler) 统一接收
```

### 事件解绑
```typescript
const handler = (data) => { /* ... */ };
sensor.on('data', handler);
sensor.off('data', handler);
```

### 检查可用性
```typescript
if (sensor.isAvailable('magnetometer')) {
  sensor.start('magnetometer');
}
```

## 3. Capacitor 插件用法（原生 App 支持）
- 推荐插件：[@capacitor/motion](https://capacitorjs.com/docs/apis/motion)
- 安装：
  ```sh
  npm install @capacitor/motion
  npx cap sync
  ```
- iOS 权限：Info.plist 增加
  ```xml
  <key>NSMotionUsageDescription</key>
  <string>需要访问运动与健身数据以提供传感器功能</string>
  ```
- 代码示例：
  ```typescript
  import { Motion } from '@capacitor/motion';
  Motion.addListener('accel', (event) => { /* ... */ });
  Motion.addListener('orientation', (event) => { /* ... */ });
  Motion.removeAllListeners();
  ```
- SensorService 已自动适配插件，业务层无需关心底层。

## 4. iPhone/iOS 兼容性说明与降级建议

### CoreMotion（原生 App，含 Capacitor/插件）
- 支持加速度、陀螺仪、磁力计、方向、计步。
- 需用户授权，部分能力需在 Info.plist 配置权限。

### Safari/移动 Web 限制
- 仅支持 DeviceMotionEvent（加速度/陀螺仪）、DeviceOrientationEvent（方向），且需 HTTPS 环境下由用户交互触发。
- 环境光、距离等大部分 iOS Safari 不支持。
- 计步、磁力计仅原生可用，Web 端无原生 API。

### 业务层安全检测/降级兼容建议
```typescript
const sensor = new SensorService();
if (sensor.isAvailable('accelerometer')) {
  sensor.start('accelerometer');
} else {
  // 降级处理，如提示用户、使用模拟数据等
}
```
- 建议所有业务在调用前先用 `isAvailable(type)` 检查，避免因权限/浏览器限制导致的报错。
- 对于 Web 端不支持的类型（如 stepCounter），建议在 UI 层直接隐藏或提示“仅原生App可用”。
- 对于需要用户授权的场景，建议引导用户在设置中开启相应权限。

---

如需扩展新类型、适配更多插件、或遇到兼容性问题请补充！
