import type { AiImageTask } from './types/ai-task';

/**
 * Cloudflare KV 任务队列服务
 * 需在 Cloudflare Worker 环境下注入 KV 命名空间实例
 */
export class AiTaskQueueService {
  constructor(private kv: KVNamespace, private queueKey = 'ai_tasks') {}

  /** 入队一个AI图片处理任务 */
  async enqueueTask(task: AiImageTask) {
    await this.kv.put(`task:${task.taskId}`, JSON.stringify(task));
    // 用list维护顺序
    const list = (await this.kv.get(this.queueKey, 'json')) as string[] || [];
    list.push(task.taskId);
    await this.kv.put(this.queueKey, JSON.stringify(list));
  }

  /** 取出下一个待处理任务（并移出队列） */
  async popTask(): Promise<AiImageTask | null> {
    const list = (await this.kv.get(this.queueKey, 'json')) as string[] || [];
    if (list.length === 0) return null;
    const taskId = list.shift();
    if (!taskId) return null;
    await this.kv.put(this.queueKey, JSON.stringify(list));
    const taskStr = await this.kv.get(`task:${taskId}`);
    return taskStr ? JSON.parse(taskStr) : null;
  }

  /** 更新任务状态 */
  async updateTaskStatus(taskId: string, status: AiImageTask['status'], result?: any, error?: any) {
    const taskStr = await this.kv.get(`task:${taskId}`);
    if (!taskStr) return;
    const task = JSON.parse(taskStr);
    task.status = status;
    if (result) task.result = result;
    if (error) task.error = error;
    await this.kv.put(`task:${taskId}`, JSON.stringify(task));
  }

  /** 查询单个任务 */
  async getTask(taskId: string): Promise<AiImageTask | null> {
    const taskStr = await this.kv.get(`task:${taskId}`);
    return taskStr ? JSON.parse(taskStr) : null;
  }
}
