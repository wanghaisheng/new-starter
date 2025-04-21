"use client"
import { useState, useEffect } from 'react';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import type { NetworkStatus } from '@/core/services/infrastructure/network/network-manager';

/**
 * useNetworkStatus - 跨端网络状态 hooks，支持 online/offline/limited/proxy/slow/unknown
 * 返回 { status, isConnected, isLimited, isProxy, isOffline, isUnknown }，并自动监听状态变化
 */
export function useNetworkStatus() {
  const manager = getNetworkManager();
  const [status, setStatus] = useState<NetworkStatus>(manager.getStatus());
  const [isConnected, setIsConnected] = useState(manager.isConnected());

  useEffect(() => {
    const handler = (s: NetworkStatus) => {
      setStatus(s);
      setIsConnected(manager.isConnected());
    };
    manager.onStatusChange(handler);
    return () => manager.offStatusChange(handler);
  }, [manager]);

  return {
    status,
    isConnected,
    isLimited: status === 'limited' || status === 'slow',
    isProxy: status === 'proxy',
    isOffline: status === 'offline',
    isUnknown: status === 'unknown',
  };
}
