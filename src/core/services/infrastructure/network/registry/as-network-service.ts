// as-network-service.ts
import type { INetworkService, INetworkManager, NetworkStatus, NetworkStatusListener } from '../types/network-types';

export function asNetworkService(manager: INetworkManager): INetworkService {
  let listeners: NetworkStatusListener[] = [];
  let initialized = false;
  return {
    async initialize() { initialized = true; },
    async dispose() { initialized = false; },
    isInitialized() { return initialized; },
    getStatus() { return manager.isConnected() ? 'online' : 'offline'; },
    onStatusChange(handler: NetworkStatusListener) {
      listeners.push(handler);
      // 可扩展：监听 manager 的 onConnect/onDisconnect 并触发 handler
    },
  };
}
