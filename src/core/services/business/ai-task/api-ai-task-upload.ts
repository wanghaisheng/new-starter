// API 路由示例：上传图片并入队AI处理
import type { AiImageTask } from './types/ai-task';
import { AiTaskQueueService } from './ai-task-queue-service';
import { ImageService } from '@/core/services/business/image/service/image-service';

// 伪代码：适配 Next.js/Express/Koa/Cloudflare Worker 等
export async function handleAiTaskUpload(req: any, kv: KVNamespace) {
  const userId = req.body.userId || req.query.userId;
  const file = req.file || req.body.file;
  if (!file || !userId) return { status: 400, body: { error: '缺少参数' } };

  // 1. 上传图片到 R2
  const imageService = new ImageService('r2');
  const uploadRes = await imageService.uploadImage(file, file.name, file.type);
  const imageUrl = uploadRes.url;

  // 2. 生成任务ID
  const taskId = `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const aiTask: AiImageTask = {
    taskId,
    userId,
    imageUrl,
    status: 'uploaded',
    createdAt: new Date().toISOString()
  };

  // 3. 入队到 Cloudflare KV
  const queueService = new AiTaskQueueService(kv);
  await queueService.enqueueTask(aiTask);

  return { status: 200, body: { taskId, imageUrl } };
}
