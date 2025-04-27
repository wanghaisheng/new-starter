import { PhotoService } from '../service/photo-service';
import { PhotoRepository } from '@/core/lib/db/repositories/photo-repository';
import type { IPhotoService } from '../types/photo-service';

/**
 * PhotoServiceRegistry 负责多环境下 PhotoService 的实例获取与适配
 * 支持 mock/remote/hybrid 等扩展，便于测试与环境切换
 */
export class PhotoServiceRegistry {
  static getDefaultService(): IPhotoService {
    // 可根据环境变量切换不同实现
    return new PhotoService(new PhotoRepository());
  }
}
