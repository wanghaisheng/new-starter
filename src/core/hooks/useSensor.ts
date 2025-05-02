import { useEffect, useState, useCallback } from 'react';
import { useSensorService } from '@/providers/ServiceProvider';
import type { ISensorService, SensorServiceType } from '@/core/services/infrastructure/phone/sensor/types/sensor-service';

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
      // 使用ServiceProvider提供的钩子获取服务实例
      const instance = useSensorService();
      if (!instance) throw new Error('Sensor 服务实例获取失败');
      // 服务已在ServiceProvider中初始化，无需再次初始化
      setSensor(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setSensor(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSensor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initSensor]);

  return { sensor, isLoading, error, empty };
}
