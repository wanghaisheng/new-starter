import type { IImageService, ImageUploadResult, ImageInfo, ImageUploadQueueEventType, ImageUploadQueueEvent } from '../types/image-service';

// 简单的 mock 图片服务适配器，支持基本上传、获取、删除和队列事件模拟
export class MockImageAdapter implements IImageService {
  private images: Record<string, ImageInfo> = {};
  private listeners: Partial<Record<ImageUploadQueueEventType, ((evt: ImageUploadQueueEvent) => void)[]>> = {};

  async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    const key = `mock_${Date.now()}_${filename}`;
    const url = `https://mock.example.com/${key}`;
    this.images[key] = {
      key,
      url,
      size: (file as any).size || 0,
      contentType,
      createdAt: new Date().toISOString(),
    };
    this.emit('progress', { type: 'progress', userId: 'mock', total: 1, finished: 1, taskId: key });
    this.emit('done', { type: 'done', userId: 'mock', total: 1, finished: 1, taskId: key });
    return { url, key };
  }

  async getImageUrl(key: string): Promise<string> {
    return this.images[key]?.url || `https://mock.example.com/${key}`;
  }

  async getImageInfo(key: string): Promise<ImageInfo> {
    return this.images[key] || { key, url: `https://mock.example.com/${key}` };
  }

  async deleteImage(key: string): Promise<void> {
    delete this.images[key];
  }

  // mock 队列方法
  enqueueBatch?(userId: string, files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>): Promise<ImageUploadResult[]> {
    return Promise.all(files.map(f => this.uploadImage(f.file, f.filename, f.contentType)));
  }

  enqueue?(userId: string, file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority = 0, maxRetry = 2): Promise<ImageUploadResult> {
    return this.uploadImage(file, filename, contentType);
  }

  retryFailedTasks?(): void {
    // mock: 无失败任务
  }
  cancelTask?(taskId: string): void {
    // mock: 无实际队列
  }
  clearQueue?(): void {
    // mock: 清空所有图片
    this.images = {};
  }

  // mock 事件订阅
  on?(event: ImageUploadQueueEventType, callback: (evt: ImageUploadQueueEvent) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(callback);
  }
  off?(event: ImageUploadQueueEventType, callback: (evt: ImageUploadQueueEvent) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(cb => cb !== callback);
  }
  private emit(event: ImageUploadQueueEventType, evt: ImageUploadQueueEvent) {
    this.listeners[event]?.forEach(cb => cb(evt));
  }
}
