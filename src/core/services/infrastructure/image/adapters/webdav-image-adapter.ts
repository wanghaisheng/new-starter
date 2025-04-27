// import type { IImageService, ImageUploadResult, ImageInfo, ImageUploadQueueEventType, ImageUploadQueueEvent } from '../types/image-service';
// // 你需要安装 webdav 包: npm install webdav
// import { createClient, WebDAVClient } from 'webdav';

// // WebDAV 图床适配器
// export class WebdavImageAdapter implements IImageService {
//   private client: WebDAVClient;
//   private baseUrl: string;
//   private listeners: Partial<Record<ImageUploadQueueEventType, ((evt: ImageUploadQueueEvent) => void)[]>> = {};

//   constructor(webdavUrl: string, username: string, password: string) {
//     this.client = createClient(webdavUrl, { username, password });
//     this.baseUrl = webdavUrl.replace(/\/$/, '');
//   }

//   async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
//     const key = `${Date.now()}_${filename}`;
//     await this.client.putFileContents(key, file as Buffer, { overwrite: true });
//     const url = `${this.baseUrl}/${key}`;
//     this.emit('progress', { type: 'progress', userId: 'webdav', total: 1, finished: 1, taskId: key });
//     this.emit('done', { type: 'done', userId: 'webdav', total: 1, finished: 1, taskId: key });
//     return { url, key };
//   }

//   async getImageUrl(key: string): Promise<string> {
//     return `${this.baseUrl}/${key}`;
//   }

//   async getImageInfo(key: string): Promise<ImageInfo> {
//     const stat = await this.client.stat(key);
//     return {
//       key,
//       url: `${this.baseUrl}/${key}`,
//       size: stat.size,
//       createdAt: stat.lastmod,
//       contentType: stat.mime,
//     };
//   }

//   async deleteImage(key: string): Promise<void> {
//     await this.client.deleteFile(key);
//   }

//   enqueueBatch?(userId: string, files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>): Promise<ImageUploadResult[]> {
//     return Promise.all(files.map(f => this.uploadImage(f.file, f.filename, f.contentType)));
//   }
//   enqueue?(userId: string, file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority = 0, maxRetry = 2): Promise<ImageUploadResult> {
//     return this.uploadImage(file, filename, contentType);
//   }
//   retryFailedTasks?(): void {}
//   cancelTask?(taskId: string): void {}
//   clearQueue?(): void {}

//   on?(event: ImageUploadQueueEventType, callback: (evt: ImageUploadQueueEvent) => void): void {
//     if (!this.listeners[event]) this.listeners[event] = [];
//     this.listeners[event]!.push(callback);
//   }
//   off?(event: ImageUploadQueueEventType, callback: (evt: ImageUploadQueueEvent) => void): void {
//     if (!this.listeners[event]) return;
//     this.listeners[event] = this.listeners[event]!.filter(cb => cb !== callback);
//   }
//   private emit(event: ImageUploadQueueEventType, evt: ImageUploadQueueEvent) {
//     this.listeners[event]?.forEach(cb => cb(evt));
//   }
// }
