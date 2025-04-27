import type { IImageService, ImageUploadResult, ImageInfo } from '../types/image-service';
import { ImageServiceFactory, ImageServiceType } from '../factory/image-service-factory';

export class ImageService implements IImageService {
  private adapter: IImageService;

  constructor(type: ImageServiceType = 'r2') {
    this.adapter = ImageServiceFactory.createService(type);
  }

  // 图片上传
  uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    return this.adapter.uploadImage(file, filename, contentType);
  }

  // 批量上传（队列）
  enqueueBatch(userId: string, files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>): Promise<ImageUploadResult[]> {
    if (typeof (this.adapter as any).enqueueBatch === 'function') {
      return (this.adapter as any).enqueueBatch(userId, files);
    }
    throw new Error('当前适配器不支持批量上传/队列能力');
  }

  // 单个文件入队
  enqueue(userId: string, file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority = 0, maxRetry = 2): Promise<ImageUploadResult> {
    if (typeof (this.adapter as any).enqueue === 'function') {
      return (this.adapter as any).enqueue(userId, file, filename, contentType, priority, maxRetry);
    }
    throw new Error('当前适配器不支持上传队列能力');
  }

  // 重试失败任务
  retryFailedTasks() {
    if (typeof (this.adapter as any).retryFailedTasks === 'function') {
      return (this.adapter as any).retryFailedTasks();
    }
    throw new Error('当前适配器不支持队列重试能力');
  }

  // 取消任务
  cancelTask(taskId: string) {
    if (typeof (this.adapter as any).cancelTask === 'function') {
      return (this.adapter as any).cancelTask(taskId);
    }
    throw new Error('当前适配器不支持队列取消能力');
  }

  // 清空队列
  clearQueue() {
    if (typeof (this.adapter as any).clearQueue === 'function') {
      return (this.adapter as any).clearQueue();
    }
    throw new Error('当前适配器不支持队列清空能力');
  }

  // 获取图片 URL
  getImageUrl(key: string): Promise<string> {
    return this.adapter.getImageUrl(key);
  }

  // 获取图片信息
  getImageInfo(key: string): Promise<ImageInfo> {
    return this.adapter.getImageInfo(key);
  }

  // 删除图片
  deleteImage(key: string): Promise<void> {
    return this.adapter.deleteImage(key);
  }
}
