import { PutObjectCommand, S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { IImageService, ImageUploadResult, ImageInfo } from '../types/image-service';
import { EventEmitter } from 'events';
import type { NotificationService } from '../../notifications/service/notification-service';

// 队列与持久化相关类型
export interface UploadTask {
  id: string;
  userId: string;
  file: Buffer | Uint8Array | Blob;
  filename: string;
  contentType: string;
  resolve: (res: ImageUploadResult) => void;
  reject: (err: any) => void;
  cancelled?: boolean;
  priority?: number;
  retryCount?: number;
  maxRetry?: number;
}

// 持久化工具
export class ImageUploadQueuePersist {
  static QUEUE_KEY = 'imageUploadQueue';
  static saveQueue(queue: UploadTask[]) {
    try {
      localStorage.setItem(ImageUploadQueuePersist.QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  }
  static loadQueue(): UploadTask[] {
    try {
      const data = localStorage.getItem(ImageUploadQueuePersist.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }
  static clearQueue() {
    try {
      localStorage.removeItem(ImageUploadQueuePersist.QUEUE_KEY);
    } catch {}
  }
}

// 上传队列服务（简化，核心逻辑）
export interface ImageUploadQueueEvent {
  type: 'progress' | 'done' | 'error' | 'cancelled' | 'retry';
  userId: string;
  total: number;
  finished: number;
  result?: ImageUploadResult;
  error?: any;
  taskId?: string;
  retryCount?: number;
}

export class ImageUploadQueueService extends EventEmitter {
  private queue: UploadTask[] = [];
  private running = false;
  private imageService: IImageService;
  private concurrency: number;
  private activeCount = 0;
  private finishedCount: Record<string, number> = {};
  private totalCount: Record<string, number> = {};
  private notificationService?: NotificationService;
  private pendingTasks: Map<string, UploadTask> = new Map();
  private failedTasks: UploadTask[] = [];
  private defaultMaxRetry = 2;

  constructor(imageService: IImageService, concurrency = 1, notificationService?: NotificationService) {
    super();
    this.imageService = imageService;
    this.concurrency = concurrency;
    this.notificationService = notificationService;
  }

  enqueueBatch(userId: string, files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>): Promise<ImageUploadResult[]> {
    this.totalCount[userId] = (this.totalCount[userId] || 0) + files.length;
    this.finishedCount[userId] = this.finishedCount[userId] || 0;
    const promises = files.map(({file, filename, contentType, priority, maxRetry}) =>
      this.enqueue(userId, file, filename, contentType, priority, maxRetry)
    );
    return Promise.all(promises);
  }

  enqueue(userId: string, file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority = 0, maxRetry = this.defaultMaxRetry): Promise<ImageUploadResult> {
    return new Promise((resolve, reject) => {
      const task: UploadTask = {
        id: `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        file,
        filename,
        contentType,
        resolve,
        reject,
        priority,
        maxRetry,
      };
      this.insertTaskByPriority(task);
      this.pendingTasks.set(task.id, task);
      this.runQueue();
    });
  }

  private insertTaskByPriority(task: UploadTask) {
    const idx = this.queue.findIndex(t => (t.priority ?? 0) < (task.priority ?? 0));
    if (idx === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(idx, 0, task);
    }
  }

  private runQueue() {
    if (this.running) return;
    this.running = true;
    const processNext = () => {
      if (this.activeCount >= this.concurrency || this.queue.length === 0) {
        this.running = false;
        return;
      }
      const task = this.queue.shift();
      if (!task) {
        this.running = false;
        return;
      }
      if (task.cancelled) {
        this.emit('cancelled', { type: 'cancelled', userId: task.userId, taskId: task.id });
        this.pendingTasks.delete(task.id);
        processNext();
        return;
      }
      this.activeCount++;
      this.imageService.uploadImage(task.file, task.filename, task.contentType)
        .then((result) => {
          task.resolve(result);
          this.finishedCount[task.userId] = (this.finishedCount[task.userId] || 0) + 1;
          this.emit('progress', { type: 'progress', userId: task.userId, taskId: task.id, finished: this.finishedCount[task.userId], total: this.totalCount[task.userId], result });
          if (this.finishedCount[task.userId] === this.totalCount[task.userId]) {
            this.emit('done', { type: 'done', userId: task.userId, finished: this.finishedCount[task.userId], total: this.totalCount[task.userId] });
          }
          if (this.notificationService && typeof this.notificationService.sendNotification === 'function') {
            this.notificationService.sendNotification({
              userId: task.userId,
              type: 'image_upload_success',
              data: result,
            });
          }
        })
        .catch((error) => {
          // 重试逻辑
          if ((task.retryCount ?? 0) < (task.maxRetry ?? this.defaultMaxRetry)) {
            task.retryCount = (task.retryCount ?? 0) + 1;
            this.emit('retry', { type: 'retry', userId: task.userId, taskId: task.id, retryCount: task.retryCount });
            this.insertTaskByPriority(task);
          } else {
            task.reject(error);
            this.failedTasks.push(task);
            this.emit('error', { type: 'error', userId: task.userId, taskId: task.id, error });
            if (this.notificationService && typeof this.notificationService.sendNotification === 'function') {
              this.notificationService.sendNotification({
                userId: task.userId,
                type: 'image_upload_failed',
                data: { error },
              });
            }
          }
        })
        .finally(() => {
          this.activeCount--;
          this.pendingTasks.delete(task.id);
          if (this.queue.length === 0 && this.activeCount === 0) {
            this.emit('done', { type: 'done', userId: task.userId, finished: this.finishedCount[task.userId] || 0, total: this.totalCount[task.userId] || 1 });
          }
          processNext();
        });
      processNext();
    };
    processNext();
  }

  retryFailedTasks() {
    const failed = [...this.failedTasks];
    this.failedTasks = [];
    failed.forEach(task => {
      task.retryCount = 0;
      this.insertTaskByPriority(task);
      this.pendingTasks.set(task.id, task);
    });
    this.runQueue();
  }

  cancelTask(taskId: string) {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      task.cancelled = true;
    }
  }

  clearQueue() {
    this.queue = [];
    this.pendingTasks.clear();
    this.failedTasks = [];
  }
}

// === 以下为原有 R2ImageAdapter 逻辑 ===

export class R2ImageAdapter implements IImageService {
  private s3: S3Client;
  private bucket: string;
  private publicBaseUrl: string;
  private imageUploadQueueService: ImageUploadQueueService;

  constructor(notificationService?: NotificationService) {
    this.s3 = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.R2_BUCKET!;
    this.publicBaseUrl = process.env.R2_PUBLIC_BASE_URL!;
    this.imageUploadQueueService = new ImageUploadQueueService(this, 1, notificationService);
  }

  async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    const key = `uploads/${Date.now()}-${filename}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    }));
    return {
      url: `${this.publicBaseUrl}/${key}`,
      key,
    };
  }

  async getImageUrl(key: string): Promise<string> {
    return `${this.publicBaseUrl}/${key}`;
  }

  async getImageInfo(key: string): Promise<ImageInfo> {
    const res = await this.s3.send(new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
      size: res.ContentLength,
      contentType: res.ContentType,
      createdAt: res.LastModified?.toISOString(),
      // 可扩展 width/height 等
    };
  }

  async deleteImage(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  enqueueBatch(userId: string, files: Array<{file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority?: number, maxRetry?: number}>): Promise<ImageUploadResult[]> {
    return this.imageUploadQueueService.enqueueBatch(userId, files);
  }

  enqueue(userId: string, file: Buffer | Uint8Array | Blob, filename: string, contentType: string, priority = 0, maxRetry = 2): Promise<ImageUploadResult> {
    return this.imageUploadQueueService.enqueue(userId, file, filename, contentType, priority, maxRetry);
  }

  retryFailedTasks() {
    this.imageUploadQueueService.retryFailedTasks();
  }

  cancelTask(taskId: string) {
    this.imageUploadQueueService.cancelTask(taskId);
  }

  clearQueue() {
    this.imageUploadQueueService.clearQueue();
  }
}
