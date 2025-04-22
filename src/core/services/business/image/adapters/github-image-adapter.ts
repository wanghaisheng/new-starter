import type { IImageService, ImageUploadResult, ImageInfo, ImageUploadQueueEventType, ImageUploadQueueEvent } from '../types/image-service';

/**
 * GitHub 图床适配器
 * 通过 GitHub API 上传图片到指定仓库（如 gh-pages 或 assets 分支），并生成 CDN 直链。
 * 依赖：环境变量 GITHUB_TOKEN、GITHUB_REPO、GITHUB_BRANCH、GITHUB_PATH、GITHUB_RAW_BASE
 */
export class GithubImageAdapter implements IImageService {
  private listeners: Partial<Record<ImageUploadQueueEventType, ((evt: ImageUploadQueueEvent) => void)[]>> = {};
  constructor(
    private token: string = (typeof process !== 'undefined' && process.env.GITHUB_TOKEN) || '',
    private repo: string = (typeof process !== 'undefined' && process.env.GITHUB_REPO) || '', // 格式：owner/repo
    private branch: string = (typeof process !== 'undefined' && process.env.GITHUB_BRANCH) || 'main',
    private path: string = (typeof process !== 'undefined' && process.env.GITHUB_PATH) || '',
    private rawBase: string = (typeof process !== 'undefined' && process.env.GITHUB_RAW_BASE) || 'https://raw.githubusercontent.com',
  ) {}

  async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const key = `${this.path ? this.path.replace(/\/$/, '') + '/' : ''}${ymd}_${Date.now()}_${filename}`;
    const url = `https://api.github.com/repos/${this.repo}/contents/${key}`;
    const content = Buffer.isBuffer(file) ? file : Buffer.from(file as Uint8Array);
    const body = {
      message: `upload image ${filename}`,
      content: content.toString('base64'),
      branch: this.branch,
    };
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok || !data.content) throw new Error(data.message || '上传到 GitHub 失败');
    this.emit('done', { type: 'done', userId: this.repo, total: 1, finished: 1, taskId: key });
    // 生成 raw.githubusercontent.com 直链
    const rawUrl = `${this.rawBase}/${this.repo}/${this.branch}/${key}`;
    return { url: rawUrl, key };
  }

  async getImageUrl(key: string): Promise<string> {
    return `${this.rawBase}/${this.repo}/${this.branch}/${key}`;
  }

  async getImageInfo(key: string): Promise<ImageInfo> {
    const url = await this.getImageUrl(key);
    return { key, url };
  }

  async deleteImage(key: string): Promise<void> {
    // 需先获取 sha
    const apiUrl = `https://api.github.com/repos/${this.repo}/contents/${key}?ref=${this.branch}`;
    const metaResp = await fetch(apiUrl, {
      headers: { 'Authorization': `token ${this.token}` }
    });
    const meta = await metaResp.json();
    if (!meta.sha) throw new Error('找不到文件 sha，无法删除');
    await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'delete image',
        sha: meta.sha,
        branch: this.branch,
      }),
    });
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
