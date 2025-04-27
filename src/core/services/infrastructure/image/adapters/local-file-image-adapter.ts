import type { IImageService, ImageUploadResult, ImageInfo, ImageUploadQueueEventType, ImageUploadQueueEvent } from '../types/image-service';
import * as path from 'path';
import * as fs from 'fs';

// 服务器本地文件存储实现（仅适用于 Node.js 环境）
export class LocalFileImageAdapter implements IImageService {
  private baseDir: string;
  private listeners: Partial<Record<ImageUploadQueueEventType, ((evt: ImageUploadQueueEvent) => void)[]>> = {};

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    const key = `${Date.now()}_${filename}`;
    const filePath = path.join(this.baseDir, key);
    await fs.promises.writeFile(filePath, file as Buffer);
    const url = `/uploads/${key}`; // 假设静态资源路由
    this.emit('progress', { type: 'progress', userId: 'local', total: 1, finished: 1, taskId: key });
    this.emit('done', { type: 'done', userId: 'local', total: 1, finished: 1, taskId: key });
    return { url, key };
  }

  async getImageUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async getImageInfo(key: string): Promise<ImageInfo> {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) throw new Error('文件不存在');
    const stat = await fs.promises.stat(filePath);
    return {
      key,
      url: `/uploads/${key}`,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      contentType: '',
    };
  }

  async deleteImage(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  enqueueBatch?(userId: string, files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>): Promise<ImageUploadResult[]> {
    return Promise.all(files.map(f => this.uploadImage(f.file, f.filename, f.contentType)));
  }
  enqueue?(userId: string, file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority = 0, maxRetry = 2): Promise<ImageUploadResult> {
    return this.uploadImage(file, filename, contentType);
  }
  retryFailedTasks?(): void {}
  cancelTask?(taskId: string): void {}
  clearQueue?(): void {}

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
