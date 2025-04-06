import { IAuthService } from './auth-service';

/**
 * 认证提供者接口
 * 定义认证提供者的结构和行为
 */
export interface AuthProvider {
  /**
   * 提供者唯一标识
   */
  name: string;
  
  /**
   * 创建服务实例的工厂函数
   */
  createService: () => IAuthService;
  
  /**
   * 配置验证模式
   * 用于验证提供者配置的有效性
   */
  configSchema?: Record<string, any>;
  
  /**
   * 提供者描述
   */
  description?: string;
  
  /**
   * 提供者版本
   */
  version?: string;
}

/**
 * 认证提供者注册表
 * 管理所有可用的认证提供者，支持动态注册和查询
 */
export class AuthProviderRegistry {
  private static instance: AuthProviderRegistry | null = null;
  private providers: Map<string, AuthProvider> = new Map();
  
  private constructor() {}
  
  /**
   * 获取注册表实例
   */
  public static getInstance(): AuthProviderRegistry {
    if (!AuthProviderRegistry.instance) {
      AuthProviderRegistry.instance = new AuthProviderRegistry();
    }
    return AuthProviderRegistry.instance;
  }
  
  /**
   * 注册新的认证提供者
   * @param provider 认证提供者
   */
  public registerProvider(provider: AuthProvider): void {
    if (!provider.name) {
      throw new Error('Provider name is required');
    }
    
    if (this.providers.has(provider.name)) {
      console.warn(`Provider '${provider.name}' is already registered. Overwriting...`);
    }
    
    this.providers.set(provider.name, provider);
    console.log(`Provider '${provider.name}' registered successfully`);
  }
  
  /**
   * 获取指定名称的认证提供者
   * @param name 提供者名称
   * @returns 认证提供者或undefined
   */
  public getProvider(name: string): AuthProvider | undefined {
    return this.providers.get(name);
  }
  
  /**
   * 获取所有可用的认证提供者名称
   * @returns 提供者名称数组
   */
  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * 获取所有已注册的认证提供者
   * @returns 认证提供者数组
   */
  public getAllProviders(): AuthProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * 移除认证提供者
   * @param name 提供者名称
   */
  public removeProvider(name: string): void {
    if (this.providers.delete(name)) {
      console.log(`Provider '${name}' removed successfully`);
    } else {
      console.warn(`Provider '${name}' not found`);
    }
  }
  
  /**
   * 清空所有认证提供者
   */
  public clearProviders(): void {
    this.providers.clear();
    console.log('All providers cleared');
  }
  
  /**
   * 验证提供者配置
   * @param name 提供者名称
   * @param config 提供者配置
   * @returns 验证结果
   */
  public validateProviderConfig(name: string, config: Record<string, any>): boolean {
    const provider = this.getProvider(name);
    if (!provider || !provider.configSchema) {
      return true; // 如果没有配置模式，则认为配置有效
    }
    
    // 简单验证：检查所有必需的配置项是否存在
    for (const [key, type] of Object.entries(provider.configSchema)) {
      if (config[key] === undefined) {
        console.error(`Missing required config: ${key} for provider ${name}`);
        return false;
      }
      
      // 类型验证
      if (type === 'string' && typeof config[key] !== 'string') {
        console.error(`Invalid config type: ${key} should be string for provider ${name}`);
        return false;
      }
      
      if (type === 'boolean' && typeof config[key] !== 'boolean') {
        console.error(`Invalid config type: ${key} should be boolean for provider ${name}`);
        return false;
      }
      
      if (type === 'number' && typeof config[key] !== 'number') {
        console.error(`Invalid config type: ${key} should be number for provider ${name}`);
        return false;
      }
    }
    
    return true;
  }
} 