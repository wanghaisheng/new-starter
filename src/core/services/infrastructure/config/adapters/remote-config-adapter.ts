// remote-config-adapter.ts
import { IConfigAdapter } from '../types/config-adapter.types';

export class RemoteConfigAdapter implements IConfigAdapter {
  private store: Record<string, any> = {};

  async initialize() {
    // TODO: 从远程配置中心拉取配置并填充 store
    // 示例：this.store = await fetchRemoteConfig();
  }
  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) { delete this.store[key]; }
}
