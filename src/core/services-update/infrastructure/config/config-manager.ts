import { ServiceConfig, InfrastructureServiceConfig } from '../types';
import { InfrastructureServiceType } from '../types';

/**
 * 配置管理器
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: InfrastructureServiceConfig;
  private environment: string = 'development';

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): InfrastructureServiceConfig {
    return {
      environment: this.environment,
      services: {
        [InfrastructureServiceType.NETWORK]: {
          adapter: 'default',
          options: {
            baseUrl: '',
            timeout: 30000,
            retry: 3,
            interceptors: []
          }
        },
        [InfrastructureServiceType.LOGGER]: {
          adapter: 'default',
          options: {
            level: 'info',
            format: 'text',
            prefix: ''
          }
        }
      }
    };
  }

  /**
   * 设置环境
   */
  setEnvironment(environment: string): void {
    this.environment = environment;
    this.config.environment = environment;
  }

  /**
   * 获取环境
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<InfrastructureServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      services: {
        ...this.config.services,
        ...config.services
      }
    };
  }

  /**
   * 获取配置
   */
  getConfig(): InfrastructureServiceConfig {
    return this.config;
  }

  /**
   * 获取服务配置
   */
  getServiceConfig(type: InfrastructureServiceType): ServiceConfig | undefined {
    return this.config.services[type];
  }

  /**
   * 设置服务配置
   */
  setServiceConfig(type: InfrastructureServiceType, config: ServiceConfig): void {
    this.config.services[type] = config;
  }

  /**
   * 从环境变量加载配置
   */
  loadFromEnv(): void {
    const env = process.env.NODE_ENV || 'development';
    this.setEnvironment(env);

    // 加载网络服务配置
    if (process.env.NETWORK_BASE_URL) {
      this.setServiceConfig(InfrastructureServiceType.NETWORK, {
        ...this.getServiceConfig(InfrastructureServiceType.NETWORK),
        options: {
          ...this.getServiceConfig(InfrastructureServiceType.NETWORK)?.options,
          baseUrl: process.env.NETWORK_BASE_URL
        }
      });
    }

    // 加载日志服务配置
    if (process.env.LOGGER_LEVEL) {
      this.setServiceConfig(InfrastructureServiceType.LOGGER, {
        ...this.getServiceConfig(InfrastructureServiceType.LOGGER),
        options: {
          ...this.getServiceConfig(InfrastructureServiceType.LOGGER)?.options,
          level: process.env.LOGGER_LEVEL
        }
      });
    }
  }

  /**
   * 从文件加载配置
   */
  async loadFromFile(path: string): Promise<void> {
    try {
      const config = await import(path);
      this.setConfig(config.default);
    } catch (error) {
      console.error('Failed to load config from file:', error);
    }
  }

  /**
   * 验证配置
   */
  validateConfig(): boolean {
    // 验证环境
    if (!this.config.environment) {
      console.error('Environment is required');
      return false;
    }

    // 验证服务配置
    for (const [type, config] of Object.entries(this.config.services)) {
      if (!config) {
        console.error(`Service config is required for type: ${type}`);
        return false;
      }

      if (!config.adapter) {
        console.error(`Adapter is required for service type: ${type}`);
        return false;
      }
    }

    return true;
  }
} 