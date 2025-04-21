import type { IImageService, ImageUploadResult, ImageInfo, ImageUploadQueueEventType, ImageUploadQueueEvent } from '../types/image-service';

/**
 * Telegram 图床适配器
 * 支持通过 Telegram Bot API 上传图片并获取直链，适用于轻量图床/分享场景。
 * 依赖：环境变量 TG_BOT_TOKEN、TG_CHAT_ID
 */
export class TelegramImageAdapter implements IImageService {
  private listeners: Partial<Record<ImageUploadQueueEventType, ((evt: ImageUploadQueueEvent) => void)[]>> = {};
  constructor(
    private botToken: string,
    private chatId: string,
  ) {}

  async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    const formData = new FormData();
    formData.append('chat_id', this.chatId);
    // Telegram sendPhoto 只接受 JPEG/PNG/GIF，超过 10MB 用 sendDocument
    formData.append('photo', new Blob([file], { type: contentType }), filename);

    const resp = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.description || '上传到 Telegram 失败');
    const fileId = data.result.photo.slice(-1)[0].file_id;
    this.emit('done', { type: 'done', userId: this.chatId, total: 1, finished: 1, taskId: fileId });
    const url = await this.getImageUrl(fileId);
    return { url, key: fileId };
  }

  async getImageUrl(key: string): Promise<string> {
    // key = file_id
    const resp = await fetch(`https://api.telegram.org/bot${this.botToken}/getFile?file_id=${key}`);
    const data = await resp.json();
    if (!data.ok) throw new Error(data.description || '获取 Telegram 文件路径失败');
    return `https://api.telegram.org/file/bot${this.botToken}/${data.result.file_path}`;
  }

  async getImageInfo(key: string): Promise<ImageInfo> {
    const url = await this.getImageUrl(key);
    return { key, url };
  }

  async deleteImage(key: string): Promise<void> {
    // Telegram 无法物理删除图片，可实现逻辑删除（如数据库标记）
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
