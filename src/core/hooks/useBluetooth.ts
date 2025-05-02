import { useEffect, useState, useCallback } from 'react';
import { useBluetoothService } from '@/providers/ServiceProvider';
import type { IBluetoothService, BluetoothServiceType } from '@/core/services/infrastructure/phone/bluetooth/types/bluetooth-service';

export interface UseBluetoothResult {
  bluetooth: IBluetoothService | null;
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
}

export function useBluetooth(options?: {
  environment?: string;
  name?: string;
  type?: BluetoothServiceType;
}): UseBluetoothResult {
  const {
    environment = 'production',
    name = 'default',
    type = 'capacitor',
  } = options || {};

  const [bluetooth, setBluetooth] = useState<IBluetoothService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);

  const initBluetooth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEmpty(false);
    try {
      // 使用ServiceProvider提供的钩子获取服务实例
      const instance = useBluetoothService();
      if (!instance) throw new Error('Bluetooth 服务实例获取失败');
      // 服务已在ServiceProvider中初始化，无需再次初始化
      setBluetooth(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setBluetooth(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initBluetooth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initBluetooth]);

  return { bluetooth, isLoading, error, empty };
}
