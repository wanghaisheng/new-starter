import { useEffect, useState, useCallback } from 'react';
import type { AiImageTask } from '@/core/services/infrastructure/ai-task/types/ai-task';

// 扩展本地任务类型以支持 file 字段（仅前端）
type LocalAiImageTask = AiImageTask & { file?: File };

/**
 * 前端AI图片任务队列与进度订阅hook
 * 需配合后端API（如 /api/ai-task/upload, /api/ai-task/status/:taskId）
 */
export function useAiImageTaskQueue(apiBase = '/api/ai-task') {
  const [tasks, setTasks] = useState<LocalAiImageTask[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 上传并入队
  const enqueueAiTask = useCallback(async (userId: string, file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      const uploadRes = await fetch(`${apiBase}/upload`, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('上传失败');
      const { imageUrl, taskId } = await uploadRes.json();
      setTasks(ts => [...ts, { taskId, userId, imageUrl, status: 'uploaded', createdAt: new Date().toISOString(), file }]);
      return { taskId, imageUrl };
    } catch (e: any) {
      setError(e.message || '上传出错');
      throw e;
    } finally {
      setUploading(false);
    }
  }, [apiBase]);

  // 订阅任务进度（轮询，实际可用WebSocket/SSE优化）
  useEffect(() => {
    if (tasks.length === 0) return;
    const interval = setInterval(async () => {
      const updated = await Promise.all(tasks.map(async t => {
        if (t.status === 'done' || t.status === 'failed') return t;
        try {
          const res = await fetch(`${apiBase}/status/${t.taskId}`);
          if (!res.ok) return t;
          const latest = await res.json();
          return { ...t, ...latest };
        } catch {
          return t;
        }
      }));
      setTasks(updated);
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, apiBase]);

  // 失败重试
  const retryTask = useCallback(async (task: LocalAiImageTask) => {
    if (!task || !task.file) return;
    await enqueueAiTask(task.userId, task.file);
  }, [enqueueAiTask]);

  // 移除已完成/失败任务
  const removeTask = useCallback((taskId: string) => {
    setTasks(ts => ts.filter(t => t.taskId !== taskId));
  }, []);

  return { tasks, uploading, error, enqueueAiTask, retryTask, removeTask };
}
