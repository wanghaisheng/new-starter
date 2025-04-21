import { useMemo } from 'react';
import { ConfigRegistry } from '@/core/services/infrastructure/config/registry/config-registry';

/**
 * useConfig
 * 统一获取全局配置服务内容，便于 hooks/页面/Provider 响应式消费。
 * 如需响应式或 Context，可后续扩展。
 */
export function useConfig() {
  // 当前实现为静态读取，如需响应式可扩展为 context/订阅
  return useMemo(() => ConfigRegistry.getInstance().getConfig(), []);
}
