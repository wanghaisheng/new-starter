import { useEffect, useState, useCallback } from 'react';
import { CameraServiceFactory } from '@/core/services/infrastructure/phone/camera/factory/camera-service-factory';
import { CameraServiceRegistry } from '@/core/services/infrastructure/phone/camera/registry/camera-service-registry';
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
      // 推荐统一通过 Registry 获取服务实例
      const registry = CameraServiceRegistry.getInstance();
      const instance = registry.getDefaultService?.() || registry.createService?.({ type }) || null;
      if (!instance) throw new Error('Camera 服务实例获取失败');
      await instance.initialize();
      setCamera(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setCamera(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    initCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCamera]);

  return { camera, isLoading, error, empty };
}
