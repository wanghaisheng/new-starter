// network-types.ts

import { NetworkProviderType } from '@/core/lib/db/types/common';

export type NetworkProviderTypeAlias = NetworkProviderType;

export interface NetworkConfig {
  provider?: NetworkProviderTypeAlias;
  [key: string]: any;
}

export type NetworkStatus = 'online' | 'offline';

export type NetworkStatusListener = (status: NetworkStatus) => void;

export interface INetworkManager {
  isConnected(): boolean;
  onConnect(handler: () => void): void;
  onDisconnect(handler: () => void): void;
}

export interface INetworkService {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;
  getStatus(): NetworkStatus;
  onStatusChange(handler: NetworkStatusListener): void;
}
