// 通知服务注册表/单例工厂，支持多环境多实例注册与获取，并内置适配器注册机制
import type { INotificationService } from '../types/notification-service';
import { NotificationServiceFactory } from '../factory/notification-service-factory';

/**
 * 通知服务注册表，支持多实例、mock/remote/hybrid 切换
 * 统一对外服务注册表，并内置适配器注册/获取接口，便于插件式扩展
 */
export class NotificationServiceRegistry {
  private static instance: NotificationServiceRegistry;
  private registry: Record<string, INotificationService> = {};
  // 适配器注册表，兼容插件式动态注册
  private static adapters: Record<string, () => INotificationService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new NotificationServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取通知服务实例
   * @param env mock/remote/hybrid
   * @param apiBaseUrl 远程 API 地址
   * @param name 实例名（默认 default）
   */
  createService(env: 'mock'|'remote'|'hybrid', apiBaseUrl?: string, name: string = 'default'): INotificationService {
    const key = `${env}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const service = NotificationServiceFactory.createService(env, apiBaseUrl);
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(env: string, name: string = 'default'): INotificationService | undefined {
    return this.registry[`${env}:${name}`];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 适配器注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: string, factory: () => INotificationService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: string): INotificationService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): INotificationService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock')
    );
  }
}
