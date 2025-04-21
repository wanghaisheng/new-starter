import type { AiImageTask } from '../types/ai-task';

export class AiTaskQueueService {
  constructor(private kv: KVNamespace, private queueKey = 'ai_tasks') {}

  async enqueueTask(task: AiImageTask) {
    await this.kv.put(`task:${task.taskId}`, JSON.stringify(task));
    const list = (await this.kv.get(this.queueKey, 'json')) as string[] || [];
    list.push(task.taskId);
    await this.kv.put(this.queueKey, JSON.stringify(list));
  }

  async popTask(): Promise<AiImageTask | null> {
    const list = (await this.kv.get(this.queueKey, 'json')) as string[] || [];
    if (list.length === 0) return null;
    const taskId = list.shift();
    if (!taskId) return null;
    await this.kv.put(this.queueKey, JSON.stringify(list));
    const taskStr = await this.kv.get(`task:${taskId}`);
    return taskStr ? JSON.parse(taskStr) : null;
  }

  async updateTaskStatus(taskId: string, status: AiImageTask['status'], result?: any, error?: any) {
    const taskStr = await this.kv.get(`task:${taskId}`);
    if (!taskStr) return;
    const task = JSON.parse(taskStr);
    task.status = status;
    if (result) task.result = result;
    if (error) task.error = error;
    await this.kv.put(`task:${taskId}`, JSON.stringify(task));
  }

  async getTask(taskId: string): Promise<AiImageTask | null> {
    const taskStr = await this.kv.get(`task:${taskId}`);
    return taskStr ? JSON.parse(taskStr) : null;
  }
}
