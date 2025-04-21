import type { IImageService } from '../types/image-service';
import { R2ImageAdapter } from '../adapters/r2-image-adapter';
import { OSSImageAdapter } from '../adapters/oss-image-adapter';
import { MockImageAdapter } from '../adapters/mock-image-adapter';
import { LocalFileImageAdapter } from '../adapters/local-file-image-adapter';
// import { WebdavImageAdapter } from '../adapters/webdav-image-adapter';
import { TelegramImageAdapter } from '../adapters/telegram-image-adapter';
import { GithubImageAdapter } from '../adapters/github-image-adapter';

const registry: Record<string, () => IImageService> = {};

export function registerImageAdapter(type: string, factory: () => IImageService) {
  registry[type] = factory;
}

export function getImageAdapter(type: string): IImageService | undefined {
  const factory = registry[type];
  return factory ? factory() : undefined;
}

/**
 * 获取默认实例（兼容 hooks 统一调用）
 * 优先 remote，其次 hybrid，其次 mock
 */
export function getDefaultService(_dataService?: unknown): IImageService {
  // 保持参数签名统一，参数未用到
  return (
    getImageAdapter('remote') ||
    getImageAdapter('hybrid') ||
    getImageAdapter('mock') ||
    new MockImageAdapter()
  );
}

// 默认注册 R2 适配器
registerImageAdapter('r2', () => new R2ImageAdapter());
// 新增注册 OSS 适配器
registerImageAdapter('oss', () => new OSSImageAdapter());
// 新增注册 Mock 适配器
registerImageAdapter('mock', () => new MockImageAdapter());
// 新增注册本地文件存储适配器
registerImageAdapter('local', () => new LocalFileImageAdapter());
// 新增注册 WebDAV 图床适配器（参数可通过全局配置/环境变量注入）
// registerImageAdapter('webdav', () => new WebdavImageAdapter(
  // process.env.WEBDAV_URL || '',
  // process.env.WEBDAV_USERNAME || '',
  // process.env.WEBDAV_PASSWORD || ''
// ));
// 注册 Telegram 图床适配器
registerImageAdapter('telegram', () => new TelegramImageAdapter(
  process.env.TG_BOT_TOKEN || '',
  process.env.TG_CHAT_ID || ''
));
// 注册 GitHub 图床适配器
registerImageAdapter('github', () => new GithubImageAdapter(
  process.env.GITHUB_TOKEN || '',
  process.env.GITHUB_REPO || '',
  process.env.GITHUB_BRANCH || 'main',
  process.env.GITHUB_PATH || '',
  process.env.GITHUB_RAW_BASE || 'https://raw.githubusercontent.com'
));

// 可在项目启动时注册自定义适配器
// registerImageAdapter('custom', () => new CustomImageAdapter());
