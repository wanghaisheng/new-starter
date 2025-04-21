// 多平台 NetworkManager 适配器注册表
import { NetworkManager, BrowserNetworkManager, NativeNetworkManager } from '@/core/services/infrastructure/network/network-manager';
import { BrowserNetworkAdapter } from '@/core/services/infrastructure/network/adapters/browser-network-adapter';
import { CapacitorNetworkAdapter } from '@/core/services/infrastructure/network/adapters/capacitor-network-adapter';
import { MockNetworkAdapter } from '@/core/services/infrastructure/network/adapters/mock-network-adapter';

let instance: NetworkManager;

export function getNetworkManager(): NetworkManager {
  if (!instance) {
    // Hybrid/Native 优先，浏览器次之，最后 fallback mock
    if (typeof window !== 'undefined' && (window as any).NativeNetwork) {
      instance = new NativeNetworkManager();
    } else {
      instance = new BrowserNetworkManager();
    }
  }
  return instance;
}
