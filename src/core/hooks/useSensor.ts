import { useEffect, useState, useCallback } from 'react';
import { SensorServiceFactory } from '@/core/services/business/phone/sensor/factory/sensor-service-factory';
import { SensorServiceRegistry } from '@/core/services/business/phone/sensor/registry/sensor-service-registry';
import type { ISensorService, SensorServiceType } from '@/core/services/business/phone/sensor/types/sensor-service';

export interface UseSensorResult {
  sensor: ISensorService | null;
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
}

export function useSensor(options?: {
  type?: SensorServiceType;
}): UseSensorResult {
  const { type = 'capacitor' } = options || {};
  const [sensor, setSensor] = useState<ISensorService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);

  const initSensor = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEmpty(false);
    try {
      // 推荐统一通过 Registry 获取服务实例
      const registry = SensorServiceRegistry.getInstance();
      const instance = registry.getDefaultService?.() || registry.createService?.(type) || null;
      if (!instance) throw new Error('Sensor 服务实例获取失败');
      await instance.initialize();
      setSensor(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setSensor(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    initSensor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initSensor]);

  return { sensor, isLoading, error, empty };
}
