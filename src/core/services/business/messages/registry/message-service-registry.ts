// 消息服务注册表/单例工厂，支持多环境多实例注册与获取
import type { IMessageService } from '../types/message-service';
import { MessageServiceFactory } from '../factory/message-service-factory';

/**
 * 消息服务注册表，支持多实例、mock/remote/hybrid/advanced-hybrid 切换
 */
export class MessageServiceRegistry {
  private static instance: MessageServiceRegistry;
  private registry: Record<string, IMessageService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new MessageServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取消息服务实例
   * @param env mock/remote/hybrid/advanced-hybrid
   * @param name 实例名（默认 default）
   * @param options 其它工厂参数
   */
  createService(env: 'mock'|'remote'|'hybrid'|'advanced-hybrid', name: string = 'default', options?: any): IMessageService {
    const key = `${env}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const service = MessageServiceFactory.createService(env, undefined, options);
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(env: string, name: string = 'default'): IMessageService | undefined {
    return this.registry[`${env}:${name}`];
  }

  /**
   * 兼容 hooks 场景的 provider 用法
   */
  getProvider(env: string, name: string = 'default', options?: any): (() => IMessageService) | undefined {
    return () => this.createService(env as any, name, options);
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): IMessageService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock')
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }
}
