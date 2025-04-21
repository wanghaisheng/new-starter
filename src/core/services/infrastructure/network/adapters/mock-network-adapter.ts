// MockNetworkAdapter: 测试/Mock 网络适配器实现
import { NetworkManager, NetworkEventHandler } from '../network-manager';

export class MockNetworkAdapter implements NetworkManager {
  private online = true;
  isConnected(): boolean { return this.online; }
  onConnect(handler: NetworkEventHandler): void { /* mock */ }
  onDisconnect(handler: NetworkEventHandler): void { /* mock */ }
  offConnect(handler: NetworkEventHandler): void { /* mock */ }
  offDisconnect(handler: NetworkEventHandler): void { /* mock */ }
  simulateLatency(ms: number): void { /* mock */ }
  simulateOffline(offline: boolean): void { this.online = !offline; }
  setOnline(status: boolean) { this.online = status; }
}
