import { useEffect, useState, useCallback } from 'react';
import { LocationServiceRegistry } from '@/core/services/business/phone/location/registry/location-service-registry';
import type { ILocationService, LocationServiceType } from '@/core/services/business/phone/location/types/location-service';

export interface UseLocationResult {
  location: ILocationService | null;
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
}

export function useLocation(options?: {
  type?: LocationServiceType;
}): UseLocationResult {
  const { type = 'capacitor' } = options || {};
  const [location, setLocation] = useState<ILocationService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);

  const initLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEmpty(false);
    try {
      // 推荐统一通过 Registry 获取服务实例
      const registry = LocationServiceRegistry.getInstance();
      const instance = registry.getDefaultService?.() || registry.createService?.(type) || null;
      if (!instance) throw new Error('Location 服务实例获取失败');
      await instance.initialize();
      setLocation(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setLocation(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    initLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initLocation]);

  return { location, isLoading, error, empty };
}
