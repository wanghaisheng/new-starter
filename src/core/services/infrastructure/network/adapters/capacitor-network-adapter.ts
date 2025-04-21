// CapacitorNetworkAdapter: 移动端网络适配器实现
import { NetworkManager, NetworkEventHandler } from '../network-manager';

export class CapacitorNetworkAdapter implements NetworkManager {
  isConnected(): boolean {
    // TODO: 调用 Capacitor 网络 API 判断在线状态
    return true;
  }
  onConnect(handler: NetworkEventHandler): void { /* TODO */ }
  onDisconnect(handler: NetworkEventHandler): void { /* TODO */ }
  offConnect(handler: NetworkEventHandler): void { /* TODO */ }
  offDisconnect(handler: NetworkEventHandler): void { /* TODO */ }
  simulateLatency(ms: number): void { /* TODO */ }
  simulateOffline(offline: boolean): void { /* TODO */ }
}
