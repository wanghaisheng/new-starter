import { IDataService } from '../types';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';

/**
 * 数据服务注册表：支持服务注册、获取和注销。
 * 日志增强：所有注册、获取、注销、销毁操作均记录日志，便于排查问题。
 */
export class DataServiceRegistry {
  private static registry: Map<string, () => IDataService> = new Map();
  private static instances: Map<string, IDataService> = new Map();
  private static logger = LoggerService.getInstance();

  /**
   * 注册服务工厂，支持懒加载
   */
  static register(key: string, factoryOrInstance: IDataService | (() => IDataService)) {
    if (typeof factoryOrInstance === 'function') {
      this.logger.info(`[DataServiceRegistry] 注册工厂: ${key}`);
      this.registry.set(key, factoryOrInstance);
    } else {
      this.logger.info(`[DataServiceRegistry] 注册实例: ${key}`);
      this.instances.set(key, factoryOrInstance);
    }
  }

  /**
   * 获取服务实例，首次调用时懒加载
   */
  static get(key: string): IDataService | undefined {
    if (this.instances.has(key)) {
      this.logger.info(`[DataServiceRegistry] 命中实例缓存: ${key}`);
      return this.instances.get(key);
    }
    const factory = this.registry.get(key);
    if (factory) {
      this.logger.info(`[DataServiceRegistry] 工厂懒加载实例: ${key}`);
      const instance = factory();
      this.instances.set(key, instance);
      return instance;
    }
    this.logger.warn(`[DataServiceRegistry] 未找到服务: ${key}`);
    return undefined;
  }

  /**
   * 按需销毁服务实例
   */
  static async dispose(key: string) {
    const inst = this.instances.get(key);
    if (inst && typeof inst.dispose === 'function') {
      this.logger.info(`[DataServiceRegistry] 调用 dispose: ${key}`);
      await inst.dispose();
    }
    this.instances.delete(key);
    this.logger.info(`[DataServiceRegistry] 已销毁实例: ${key}`);
  }

  /**
   * 注销服务
   */
  static unregister(key: string) {
    this.logger.info(`[DataServiceRegistry] 注销服务: ${key}`);
    this.registry.delete(key);
    this.instances.delete(key);
  }

  /**
   * 热切换服务实例，自动释放旧资源并初始化新实例
   */
  static async switchAdapter(key: string, factory: () => IDataService) {
    // 1. 释放旧实例资源（如有）
    const oldInst = this.instances.get(key);
    if (oldInst && typeof oldInst.dispose === 'function') {
      this.logger.info(`[DataServiceRegistry] switchAdapter: 释放旧实例资源: ${key}`);
      try {
        await oldInst.dispose();
      } catch (err) {
        this.logger.error(`[DataServiceRegistry] switchAdapter: 释放资源异常: ${key} - ${(err as Error).message}`);
        throw err;
      }
    }
    // 2. 注销旧实例
    this.instances.delete(key);
    // 3. 注册新工厂并懒加载新实例
    this.logger.info(`[DataServiceRegistry] switchAdapter: 注册新工厂并懒加载: ${key}`);
    this.registry.set(key, factory);
    const newInst = factory();
    if (typeof newInst.initialize === 'function') {
      await newInst.initialize();
    }
    this.instances.set(key, newInst);
    this.logger.info(`[DataServiceRegistry] switchAdapter: 新实例已初始化: ${key}`);
    return newInst;
  }

  /**
   * 重建服务实例：销毁旧实例并重新初始化新实例（适用于账号切换、配置变更等场景）
   */
  static async rebuild(key: string): Promise<IDataService | undefined> {
    this.logger.info(`[DataServiceRegistry] rebuild: 开始重建服务实例: ${key}`);
    await this.dispose(key);
    const factory = this.registry.get(key);
    if (!factory) {
      this.logger.warn(`[DataServiceRegistry] rebuild: 未找到工厂: ${key}`);
      return undefined;
    }
    const newInst = factory();
    if (typeof newInst.initialize === 'function') {
      await newInst.initialize();
    }
    this.instances.set(key, newInst);
    this.logger.info(`[DataServiceRegistry] rebuild: 新实例已初始化: ${key}`);
    return newInst;
  }

  /**
   * 重置服务实例（软重置）：调用实例 reset 方法（如有），不销毁对象，可用于清理缓存/状态
   */
  static async reset(key: string): Promise<void> {
    const inst = this.instances.get(key);
    if (inst && typeof (inst as any).reset === 'function') {
      this.logger.info(`[DataServiceRegistry] reset: 调用 reset: ${key}`);
      await (inst as any).reset();
      this.logger.info(`[DataServiceRegistry] reset: 状态已重置: ${key}`);
    } else {
      this.logger.info(`[DataServiceRegistry] reset: 未实现 reset 方法: ${key}`);
    }
  }

  /**
   * 健康检查：调用实例的 checkHealth 方法
   */
  static async checkHealth(key: string): Promise<{ healthy: boolean; reason?: string }> {
    const inst = this.instances.get(key);
    if (inst && typeof inst.checkHealth === 'function') {
      return await inst.checkHealth();
    }
    return { healthy: false, reason: 'No checkHealth implemented' };
  }
}
