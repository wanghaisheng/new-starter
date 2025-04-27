import { ImageServiceRegistry } from '../registry/image-service-registry';
import type { IImageService } from '../types/image-service';

// 支持的图片服务类型，可通过配置扩展
export type ImageServiceType = 'r2' | 'oss' | 'mock' | 'localfile' | 'telegram' | 'github';
export type ImageServiceOptions = {
  [key: string]: any;
};

export class ImageServiceFactory {
  /**
   * 获取图片服务实例
   * @param params 图片服务类型（如 'r2'、'oss'、'cos'），可通过配置/环境变量/自动推断
   * @param params.dataService 可选依赖注入（如 notificationService）
   * @param params.options 可选配置项
   */
  static createService({
    type = 'mock',
    dataService,
    options = {}
  }: {
    type?: ImageServiceType,
    dataService?: any,
    options?: ImageServiceOptions
  } = {}): IImageService {
    const useType = type;
    // 允许适配器工厂根据依赖参数实例化
    const adapterFactory = ImageServiceRegistry.getAdapter(useType);

    if (!adapterFactory) {
      throw new Error(`[ImageServiceFactory] No image adapter registered for type: ${useType}`);
    }
    // 支持依赖注入（如果适配器支持）
    if (typeof adapterFactory === 'function') {
      return adapterFactory();
    }
    return adapterFactory;
  }
}
