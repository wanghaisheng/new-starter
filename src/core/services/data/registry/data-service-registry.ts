 import type { IDataService } from '../types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';

/**
 * 数据服务注册表：支持服务注册、获取和注销。
 * 日志增强：所有注册、获取、注销、销毁操作均记录日志，便于排查问题。
 *
 * 类型安全：所有实例类型统一为 IDataService<BaseEntity>
 */
export class DataServiceRegistry {
  private static registry: Map<string, () => IDataService<BaseEntity>> = new Map();
  private static instances: Map<string, IDataService<BaseEntity>> = new Map();
  private static logger = LoggerService.getInstance();

  /**
   * 注册服务工厂，支持懒加载
   */
  static register(key: string, factoryOrInstance: IDataService<BaseEntity> | (() => IDataService<BaseEntity>)) {
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
  static get(key: string): IDataService<BaseEntity> | undefined {
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
    this.registry.delete(key);
    this.instances.delete(key);
    this.logger.info(`[DataServiceRegistry] 已注销服务: ${key}`);
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
