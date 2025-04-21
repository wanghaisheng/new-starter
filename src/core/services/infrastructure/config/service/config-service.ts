// ConfigService 实现
import { IConfigService, InfrastructureServiceType, InfrastructureServiceConfig } from '@core/services/infrastructure/types';

export class ConfigService implements IConfigService {
  private static instance: ConfigService;
  private _isInitialized = false;
  private config: InfrastructureServiceConfig = { id: 'config', type: 'config' };
  private store: Record<string, any> = {};

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }
  getServiceType(): InfrastructureServiceType { return InfrastructureServiceType.CONFIG; }
  getConfig(): InfrastructureServiceConfig { return this.config; }

  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T): void { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string): void { delete this.store[key]; }
}

// 注释或移除找不到的 re-export，防止构建报错
// export * from '../config-manager';
