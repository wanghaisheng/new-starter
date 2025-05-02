import { useEffect, useState, useCallback } from 'react';
import { useNFCService } from '@/providers/ServiceProvider';
import type { INFCService, NFCServiceType } from '@/core/services/infrastructure/phone/nfc/types/nfc-service';

export interface UseNFCResult {
  nfc: INFCService | null;
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
}

export function useNFC(options?: {
  type?: NFCServiceType;
}): UseNFCResult {
  const { type = 'capacitor' } = options || {};
  const [nfc, setNfc] = useState<INFCService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);

  const initNFC = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEmpty(false);
    try {
      // 使用ServiceProvider提供的钩子获取服务实例
      const instance = useNFCService();
      if (!instance) throw new Error('NFC 服务实例获取失败');
      // 服务已在ServiceProvider中初始化，无需再次初始化
      setNfc(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setNfc(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initNFC();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initNFC]);

  return { nfc, isLoading, error, empty };
}
