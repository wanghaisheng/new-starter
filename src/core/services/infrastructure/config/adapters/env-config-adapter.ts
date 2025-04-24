// env-config-adapter.ts
import { IConfigAdapter } from '../types/config-adapter';

const ENV_KEYS = [
  'ENV_STAGE',
  'API_BASE_URL',
  'DATA_MODE',
  'PROVIDER_TYPE',
  'MOCK_DB_MODE',
  'ONLINE_DB',
  'OFFLINE_DB',
  'LOG_LEVEL',
  'FEATURE_FLAG',
  'BRAND',
  'SYNC_AUTO_ON_CONNECT',
  'SYNC_INTERVAL',
  'SYNC_CONFLICT_RESOLUTION',
];

export class EnvConfigAdapter implements IConfigAdapter {
  private store: Record<string, any> = {};

  async initialize() {
    ENV_KEYS.forEach(key => {
      if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        this.store[key] = process.env[key];
      }
    });
  }
  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) { delete this.store[key]; }
}
