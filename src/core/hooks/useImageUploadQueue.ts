import { useEffect, useRef, useState, useCallback } from 'react';
import { useImageService } from '@/providers/ServiceProvider';

// 统一通过工厂获取服务实例，支持配置和依赖注入
export function useImageUploadQueue(type?: string, dependencies?: Record<string, any>) {
  // 使用ServiceProvider获取图片服务实例
  const imageService = useImageService();
  const serviceRef = useRef(imageService);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [failed, setFailed] = useState<any[]>([]);

  useEffect(() => {
    const service = serviceRef.current;
    // 事件订阅（需适配器实现 EventEmitter 或类似 on/off 方法）
    const onProgress = (evt: any) => setProgress(p => ({ ...p, [evt.taskId]: evt }));
    const onError = (evt: any) => setFailed(f => [...f, evt]);
    if (service && service.on) {
      service.on('progress', onProgress);
      service.on('error', onError);
      service.on('retry', onProgress);
      service.on('done', onProgress);
      service.on('cancelled', onProgress);
    }
    return () => {
      if (service && service.off) {
        service.off('progress', onProgress);
        service.off('error', onError);
        service.off('retry', onProgress);
        service.off('done', onProgress);
        service.off('cancelled', onProgress);
      }
    };
  }, []);

  const upload = useCallback((userId: string, files: File[], priority = 0) => {
    files.forEach(file => {
      if (serviceRef.current && typeof serviceRef.current.enqueue === 'function') {
        serviceRef.current.enqueue(userId, file, file.name, file.type, priority);
      }
    });
  }, []);

  const retry = useCallback(() => {
    if (serviceRef.current && typeof serviceRef.current.retryFailedTasks === 'function') {
      serviceRef.current.retryFailedTasks();
    }
  }, []);

  return { upload, progress, failed, retry };
}
