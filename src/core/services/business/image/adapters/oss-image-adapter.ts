import type { IImageService, ImageUploadResult, ImageInfo } from '../types/image-service';

// 示例：OSSImageAdapter，模拟阿里云 OSS 实现（仅结构示范，需对接真实 SDK）
export class OSSImageAdapter implements IImageService {
  async uploadImage(file: Buffer | Uint8Array | Blob, filename: string, contentType: string): Promise<ImageUploadResult> {
    // TODO: 对接 OSS 上传逻辑
    return {
      url: `https://oss.example.com/${filename}`,
      key: filename,
    };
  }

  async getImageUrl(key: string): Promise<string> {
    return `https://oss.example.com/${key}`;
  }

  async getImageInfo(key: string): Promise<ImageInfo> {
    // TODO: 对接 OSS 获取图片信息逻辑
    return {
      key,
      url: `https://oss.example.com/${key}`,
      size: 0,
      contentType: 'image/jpeg',
      createdAt: new Date().toISOString(),
    };
  }

  async deleteImage(key: string): Promise<void> {
    // TODO: 对接 OSS 删除逻辑
  }
}
