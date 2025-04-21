// 图片服务接口与类型定义，支持上传、获取、删除等能力
export interface ImageInfo {
  key: string;
  url: string;
  size?: number;
  width?: number;
  height?: number;
  contentType?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ImageUploadResult {
  url: string;
  key: string;
}

// 队列相关事件类型
export type ImageUploadQueueEventType = 'progress' | 'done' | 'error' | 'cancelled' | 'retry';
export interface ImageUploadQueueEvent {
  type: ImageUploadQueueEventType;
  userId: string;
  total: number;
  finished: number;
  result?: ImageUploadResult;
  error?: any;
  taskId?: string;
  retryCount?: number;
}

export interface IImageService {
  uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult>;
  getImageUrl(key: string): Promise<string>;
  getImageInfo(key: string): Promise<ImageInfo>;
  deleteImage(key: string): Promise<void>;
  // 队列能力（部分 adapter 支持，未实现可抛异常）
  enqueueBatch?(
    userId: string,
    files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>
  ): Promise<ImageUploadResult[]>;
  enqueue?(
    userId: string,
    file: Buffer | Uint8Array | Blob,
    filename: string,
    contentType: string,
    priority?: number,
    maxRetry?: number
  ): Promise<ImageUploadResult>;
  retryFailedTasks?(): void;
  cancelTask?(taskId: string): void;
  clearQueue?(): void;
  // 事件订阅（部分 adapter 支持，未实现可为 undefined）
  on?(event: ImageUploadQueueEventType, callback: (evt: ImageUploadQueueEvent) => void): void;
  off?(event: ImageUploadQueueEventType, callback: (evt: ImageUploadQueueEvent) => void): void;
  // 可扩展更多图片处理能力，如裁剪、压缩、生成缩略图等
}
