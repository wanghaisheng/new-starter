import { useEffect, useState, useCallback } from 'react';
import { BluetoothServiceRegistry } from '@/core/services/business/phone/bluetooth/registry/bluetooth-service-registry';
import type { IBluetoothService, BluetoothServiceType } from '@/core/services/business/phone/bluetooth/types/bluetooth-service';

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
      BluetoothServiceRegistry.registerAllAdapters(); // 确保已注册所有适配器
      const instance = BluetoothServiceRegistry.getInstance().createService({ environment, name, type });
      await instance.initialize();
      setBluetooth(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setBluetooth(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, [environment, name, type]);

  useEffect(() => {
    initBluetooth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initBluetooth]);

  return { bluetooth, isLoading, error, empty };
}
