// 多平台 NetworkManager 适配器注册表
import type { INetworkService, NetworkProviderType, NetworkConfig } from '../types/network-types';
import { MockNetworkAdapter } from '../adapters/mock-network-adapter';
import { BrowserNetworkAdapter } from '../adapters/browser-network-adapter';
import { CapacitorNetworkAdapter } from '../adapters/capacitor-network-adapter';
import { asNetworkService } from './as-network-service';

/**
 * 插件化 Network 注册表，统一适配器注册/检测/获取/枚举。
 * 推荐仅用于插件/底层扩展，业务层优先用 NetworkFactory。
 */
export class NetworkRegistry {
  private static adapters: Record<NetworkProviderType, (config?: NetworkConfig) => INetworkService> = {
    mock: () => asNetworkService(new MockNetworkAdapter()),
    browser: () => asNetworkService(new BrowserNetworkAdapter()),
    capacitor: () => asNetworkService(new CapacitorNetworkAdapter()),
    default: () => asNetworkService(new BrowserNetworkAdapter()),
  };

  static registerAdapter(provider: NetworkProviderType, factory: (config?: NetworkConfig) => INetworkService) {
    this.adapters[provider] = factory;
  }
  static getAdapter(provider: NetworkProviderType, config?: NetworkConfig): INetworkService | undefined {
    const factory = this.adapters[provider];
    return factory ? factory(config) : undefined;
  }
  static isAdapterRegistered(provider: NetworkProviderType): boolean {
    return !!this.adapters[provider];
  }
  static getAvailableProviders(): NetworkProviderType[] {
    return Object.keys(this.adapters) as NetworkProviderType[];
  }
}
