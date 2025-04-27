// 图片服务类型与 options 类型定义
import type { IImageService } from '../types/image-service';
import { R2ImageAdapter } from '../adapters/r2-image-adapter';
import { OSSImageAdapter } from '../adapters/oss-image-adapter';
import { MockImageAdapter } from '../adapters/mock-image-adapter';
import { LocalFileImageAdapter } from '../adapters/local-file-image-adapter';
import { TelegramImageAdapter } from '../adapters/telegram-image-adapter';
import { GithubImageAdapter } from '../adapters/github-image-adapter';
import { ImageServiceFactory, ImageServiceType, ImageServiceOptions } from '../factory/image-service-factory';

class ImageServiceRegistry {
  private registry: Record<string, IImageService> = {};
  private static adapters: Partial<Record<ImageServiceType, () => IImageService>> = {};

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   * @param type 服务类型
   * @param name 实例名，默认 'default'
   * @param dataService 预留，兼容统一签名
   * @param options 其它扩展参数，预留
   */
  getProvider(type: ImageServiceType = 'mock', name: string = 'default', dataService?: any, options?: ImageServiceOptions): () => IImageService {
    return () => this.createService(type, name, dataService, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   */
  createService(type: ImageServiceType = 'mock', name: string = 'default', dataService?: any, options?: ImageServiceOptions): IImageService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = ImageServiceRegistry.adapters[type];
    const service = adapter
      ? adapter()
      : ImageServiceFactory.createService({ type, dataService, options });
    this.registry[key] = service;
    return service;
  }

  /**
   * 获取已注册实例
   */
  getService(type: ImageServiceType, name: string = 'default'): IImageService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * 适配器注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: ImageServiceType, factory: () => IImageService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: ImageServiceType): (() => IImageService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: ImageServiceType): void {
    delete this.adapters[type];
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 r2，其次 oss，其次 mock
   */
  getDefaultService(dataService?: any, options?: ImageServiceOptions): IImageService {
    return (
      this.getService('r2') ||
      this.getService('oss') ||
      this.getService('mock') ||
      this.createService('mock', 'default', dataService, options)
    );
  }

  /**
   * 清空注册表
   */
  clear() {
    this.registry = {};
  }

  /**
   * 注册所有适配器
   */
  static registerAllAdapters(dataService?: any) {
    ImageServiceRegistry.registerAdapter('r2', () => ImageServiceFactory.createService({ type: 'r2', dataService }));
    ImageServiceRegistry.registerAdapter('oss', () => ImageServiceFactory.createService({ type: 'oss', dataService }));
    ImageServiceRegistry.registerAdapter('mock', () => ImageServiceFactory.createService({ type: 'mock', dataService }));
    ImageServiceRegistry.registerAdapter('localfile', () => ImageServiceFactory.createService({ type: 'localfile', dataService }));
    ImageServiceRegistry.registerAdapter('telegram', () => ImageServiceFactory.createService({ type: 'telegram', dataService }));
    ImageServiceRegistry.registerAdapter('github', () => ImageServiceFactory.createService({ type: 'github', dataService }));
  }
}

const imageServiceRegistry = new ImageServiceRegistry();

export { imageServiceRegistry, ImageServiceRegistry };
