# 蓝牙服务（BluetoothService）用法与兼容性说明

## 1. 能力概览
- 支持 iPhone/iOS/Android/Web 主流蓝牙能力：
  - 设备扫描、连接、断开
  - 指定 service/characteristic 监听 notify/indicate 数据
  - 主动写入数据到指定特征
  - 多设备并发连接与事件监听
- 提供 Web、Capacitor、Mock 三种实现，自动工厂分发。

## 2. 业务调用示例

### 监听指定 service/characteristic 的 notify/indicate 数据
```typescript
const service = new BluetoothService();
service.on('dataReceived', ({ deviceId, serviceUUID, characteristicUUID, value }) => {
  // 处理蓝牙数据
});
await service.connect(deviceId, {
  serviceUUIDs: ['service-uuid'],
  characteristicUUIDs: ['char-uuid'],
});
```

### 主动写入数据到指定特征
```typescript
await service.write(deviceId, 'service-uuid', 'char-uuid', new Uint8Array([1,2,3]));
```

### 多设备并发连接与监听
```typescript
const serviceA = new BluetoothService();
const serviceB = new BluetoothService();
await serviceA.connect('deviceA', { serviceUUIDs: ['s1'], characteristicUUIDs: ['c1'] });
await serviceB.connect('deviceB', { serviceUUIDs: ['s2'], characteristicUUIDs: ['c2'] });
// 分别监听各自数据流
serviceA.on('dataReceived', handlerA);
serviceB.on('dataReceived', handlerB);
```

### 事件解绑
```typescript
const onData = (payload) => { /* ... */ };
service.on('dataReceived', onData);
service.off('dataReceived', onData);
```

## 3. 兼容性与降级建议
- 支持 Web/Capacitor/Mock 三端一致的业务调用体验。
- 建议所有业务调用前用 `isAvailable()` 检查。
- 对于不支持的设备或浏览器，建议 UI 层提示或降级为模拟实现。

## 4. 单元测试与 Mock 支持
- MockBluetoothAdapter 可用于前端/自动化测试环境，无需真实蓝牙硬件。
- 推荐在 `__tests__` 目录下编写覆盖各种业务场景的单元测试。

## 5. 相关接口定义
- 详细接口见 `types/bluetooth-service.ts`。
- 支持自定义扩展业务事件与设备筛选。

---

如需扩展新蓝牙协议、适配更多插件、或遇到兼容性问题请补充！
