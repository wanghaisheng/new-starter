import { getImageAdapter } from '../registry/image-service-registry';
import type { IImageService } from '../types/image-service';

// 支持的图片服务类型，可通过配置扩展
export type ImageServiceType = string;

// 允许通过环境变量或全局配置决定默认适配器类型
declare const process: any;
const env = typeof process !== 'undefined' && process.env && process.env.NODE_ENV
  ? process.env.NODE_ENV
  : 'production';

const DEFAULT_IMAGE_SERVICE_TYPE: ImageServiceType =
  typeof process !== 'undefined' && process.env && process.env.IMAGE_SERVICE_TYPE
    ? process.env.IMAGE_SERVICE_TYPE
    : (env === 'test' || env === 'development' ? 'oss' : 'r2');

export class ImageServiceFactory {
  /**
   * 获取图片服务实例
   * @param type 图片服务类型（如 'r2'、'oss'、'cos'），可通过配置/环境变量/自动推断
   * @param dependencies 可选依赖注入（如 notificationService）
   */
  static createService(
    type?: ImageServiceType,
    dependencies?: Record<string, any>
  ): IImageService {
    const useType = type || DEFAULT_IMAGE_SERVICE_TYPE;
    // 允许适配器工厂根据依赖参数实例化
    const adapterFactory = (getImageAdapter as any).factoryWithDeps
      ? (getImageAdapter as any).factoryWithDeps(useType, dependencies)
      : getImageAdapter(useType);

    if (!adapterFactory) {
      throw new Error(`[ImageServiceFactory] No image adapter registered for type: ${useType}`);
    }
    // 支持依赖注入（如果适配器支持）
    if (typeof adapterFactory === 'function') {
      return adapterFactory(dependencies);
    }
    return adapterFactory;
  }
}
