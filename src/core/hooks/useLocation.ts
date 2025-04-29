import { useEffect, useState, useCallback } from 'react';
import { useService } from '@/providers/ServiceProvider';
import type { LocationServiceType } from '@/core/services/infrastructure/phone/location/types/location-service';
import type { Location } from '@/core/lib/db/types/location.types';

/**
 * useLocation 结果类型，location 字段为标准 Location 类型
 */
export interface UseLocationResult {
  location: Location | null;
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
}

export function useLocation(options?: {
  type?: LocationServiceType;
}): UseLocationResult {
  const { type = 'capacitor' } = options || {};
  const { locationService } = useService();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);

  const initLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEmpty(false);
    try {
      if (!locationService) throw new Error('Location 服务实例获取失败');
      await locationService.initialize();
      const locData = await locationService.getCurrentPosition?.();
      if (locData && typeof locData.latitude === 'number' && typeof locData.longitude === 'number') {
        const city = locData.city ?? '';
        const country = locData.country ?? '';
        setLocation({
          latitude: locData.latitude,
          longitude: locData.longitude,
          city,
          country,
          ext: { ...locData }
        });
        setEmpty(false);
      } else {
        setLocation(null);
        setEmpty(true);
      }
    } catch (e: any) {
      setError(e);
      setLocation(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, [locationService, type]);

  useEffect(() => {
    initLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initLocation]);

  return { location, isLoading, error, empty };
}
