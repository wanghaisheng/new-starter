// 仓储工厂注册表（插件式），参考 CameraServiceFactory 设计
export type RepositoryFactory = (options?: any) => any;

export class RepositoryFactoryRegistry {
  private static factories: Record<string, RepositoryFactory> = {};

  /**
   * 注册仓储工厂（如 user、user-mock、match 等）
   */
  static registerFactory(key: string, factory: RepositoryFactory) {
    if (this.factories[key]) {
      // 避免重复注册，输出警告
      // eslint-disable-next-line no-console
      console.warn(`[RepositoryFactoryRegistry] Factory for key '${key}' already registered, will overwrite.`);
    }
    this.factories[key] = factory;
  }

  /**
   * 获取仓储工厂
   */
  static getFactory(key: string): RepositoryFactory | undefined {
    return this.factories[key];
  }

  /**
   * 获取所有已注册的 key
   */
  static getAvailableKeys(): string[] {
    return Object.keys(this.factories);
  }

  /**
   * 清空所有已注册工厂（便于测试/热重载）
   */
  static clear() {
    this.factories = {};
  }

  /**
   * 注册所有内置工厂（自动导入所有适配器实现，支持插件式扩展）
   * 推荐在应用初始化阶段调用一次
   */
  static registerAllFactories() {
    // 集中导入所有适配器注册文件
    require('./auto-register-adapters');
  }
}
