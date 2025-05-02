import { useEffect, useState, useCallback } from 'react';
import { useCameraService } from '@/providers/ServiceProvider';
import type { ICameraService, CameraServiceType } from '@/core/services/infrastructure/phone/camera/types/camera-service';

export interface UseCameraResult {
  camera: ICameraService | null;
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
}

export function useCamera(options?: {
  type?: CameraServiceType;
}): UseCameraResult {
  const { type = 'capacitor' } = options || {};
  const [camera, setCamera] = useState<ICameraService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);

  const initCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEmpty(false);
    try {
      // 使用ServiceProvider提供的钩子获取服务实例
      const instance = useCameraService();
      if (!instance) throw new Error('Camera 服务实例获取失败');
      // 服务已在ServiceProvider中初始化，无需再次初始化
      setCamera(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setCamera(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCamera]);

  return { camera, isLoading, error, empty };
}
