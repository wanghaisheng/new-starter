// network barrel: 仅导出官方 API
export { getNetworkManager } from './registry/network-registry';
export type { NetworkManager, NetworkEventHandler } from './network-manager';
export type { NetworkStatus, NetworkStatusListener } from './types/network-types';