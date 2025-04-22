// config-factory.ts
import { EnvConfigAdapter } from '../adapters/env-config-adapter';
import { RemoteConfigAdapter } from '../adapters/remote-config-adapter';
import { MockConfigAdapter } from '../adapters/mock-config-adapter';
import { IConfigAdapter } from '../types/config-adapter.types';

/**
 * 根据 CONFIG_ADAPTER 环境变量动态选择配置源。
 * 支持 'env'（默认）、'remote'、'mock' 三种 adapter。
 */
export function createConfigAdapter(): IConfigAdapter {
  const type = (typeof process !== 'undefined' && process.env && process.env.CONFIG_ADAPTER) || 'env';
  switch (type) {
    case 'remote': return new RemoteConfigAdapter();
    case 'mock': return new MockConfigAdapter();
    case 'env':
    default: return new EnvConfigAdapter();
  }
}
