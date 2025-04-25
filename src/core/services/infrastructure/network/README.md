# Network Manager 跨端网络状态感知

## 能力说明
- 支持多种网络状态：online、offline、limited（弱网）、proxy（代理）、slow（慢速）、unknown
- 跨端适配：浏览器（BrowserNetworkManager）、Hybrid/Native（NativeNetworkManager）
- 统一事件监听：onStatusChange、onConnect、onDisconnect
- 支持模拟弱网、离线、代理等场景，便于测试

## 用法示例
```ts
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';

const manager = getNetworkManager();
const status = manager.getStatus(); // 'online' | 'limited' | 'proxy' ...

manager.onStatusChange((status) => {
  if (status === 'proxy') {
    // 提示用户当前处于代理环境
  }
});
```

## React Hooks 推荐
```ts
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
const { status, isConnected, isLimited, isProxy, isOffline } = useNetworkStatus();
```

## 扩展说明
- NativeNetworkManager 需对接实际 Native 事件桥接
- registry 层自动切换实现，无需业务层关心
- 支持自动降级到 mock/浏览器实现

## 环境变量与配置项

- 推荐通过 `NEXT_PUBLIC_NETWORK_PROVIDER` 或 `NETWORK_PROVIDER` 控制网络适配器选择（如 mock/browser/capacitor/native）
- NetworkFactory 会自动按“参数 > 配置服务 > 环境变量 > 默认”优先级推理 provider
- 统一通过配置服务访问：`configService.get('NETWORK_PROVIDER')`

## 测试
见 __tests__/network-manager.test.ts
