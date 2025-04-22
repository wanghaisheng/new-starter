// 消息服务注册表/单例工厂，支持多环境多实例注册与获取
import type { IMessageService } from '../types/message-service';
import { MessageServiceFactory, MessageServiceType, MessageServiceOptions } from '../factory/message-service-factory';

/**
 * 消息服务注册表，支持多实例、mock/remote/hybrid/advanced-hybrid 切换
 */
export class MessageServiceRegistry {
  private static instance: MessageServiceRegistry;
  private registry: Record<string, IMessageService> = {};
  private static adapters: Partial<Record<MessageServiceType, (options?: MessageServiceOptions) => IMessageService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new MessageServiceRegistry();
    return this.instance;
  }

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   * @param type 服务类型
   * @param name 实例名，默认 'default'
   * @param dataService 预留，兼容统一签名
   * @param options 其它扩展参数，预留
   */
  getProvider(type: MessageServiceType = 'mock', name: string = 'default', dataService?: any, options?: MessageServiceOptions): () => IMessageService {
    return () => this.createService(type, name, dataService, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   */
  createService(
    type: MessageServiceType = 'mock',
    name: string = 'default',
    dataService?: any,
    options?: MessageServiceOptions
  ): IMessageService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = MessageServiceRegistry.adapters[type];
    const service = adapter
      ? adapter(options)
      : MessageServiceFactory.createService({ type, dataService, options });
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: MessageServiceType, name: string): IMessageService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(dataService?: any, options?: MessageServiceOptions): IMessageService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService('mock', 'default', dataService, options)
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 注册适配器
   * @param type 服务类型
   * @param factory 工厂函数，支持 options
   */
  static registerAdapter(type: MessageServiceType, factory: (options?: MessageServiceOptions) => IMessageService): void {
    this.adapters[type] = factory;
  }

  /**
   * 获取适配器
   * @param type 服务类型
   */
  static getAdapter(type: MessageServiceType): ((options?: MessageServiceOptions) => IMessageService) | undefined {
    return this.adapters[type];
  }

  /**
   * 注销适配器
   * @param type 服务类型
   */
  static unregisterAdapter(type: MessageServiceType): void {
    delete this.adapters[type];
  }

  /**
   * 注册所有适配器
   */
  static registerAllAdapters() {
    MessageServiceRegistry.registerAdapter('mock', (options) => MessageServiceFactory.createService({ type: 'mock', options }));
    MessageServiceRegistry.registerAdapter('remote', (options) => MessageServiceFactory.createService({ type: 'remote', options }));
    MessageServiceRegistry.registerAdapter('hybrid', (options) => MessageServiceFactory.createService({ type: 'hybrid', options }));
    MessageServiceRegistry.registerAdapter('advanced-hybrid', (options) => MessageServiceFactory.createService({ type: 'advanced-hybrid', options }));
  }
}
