import { IDataService } from '../types';

/**
 * 数据服务注册表：支持服务注册、获取和注销。
 */
export class DataServiceRegistry {
  private static registry: Map<string, () => IDataService> = new Map();
  private static instances: Map<string, IDataService> = new Map();

  /**
   * 注册服务工厂，支持懒加载
   */
  static register(key: string, factoryOrInstance: IDataService | (() => IDataService)) {
    if (typeof factoryOrInstance === 'function') {
      this.registry.set(key, factoryOrInstance);
    } else {
      // 兼容直接注册实例
      this.instances.set(key, factoryOrInstance);
    }
  }

  /**
   * 获取服务实例，首次调用时懒加载
   */
  static get(key: string): IDataService | undefined {
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }
    const factory = this.registry.get(key);
    if (factory) {
      const instance = factory();
      this.instances.set(key, instance);
      return instance;
    }
    return undefined;
  }

  /**
   * 按需销毁服务实例
   */
  static async dispose(key: string) {
    const inst = this.instances.get(key);
    if (inst && typeof inst.dispose === 'function') {
      await inst.dispose();
    }
    this.instances.delete(key);
  }

  /**
   * 注销服务
   */
  static unregister(key: string) {
    this.registry.delete(key);
    this.instances.delete(key);
  }
}
