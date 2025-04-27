import { useEffect, useState, useCallback } from 'react';
import { NFCServiceFactory } from '@/core/services/infrastructure/phone/nfc/factory/nfc-service-factory';
import { NFCServiceRegistry } from '@/core/services/infrastructure/phone/nfc/registry/nfc-service-registry';
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
      // 推荐统一通过 Registry 获取服务实例
      const registry = NFCServiceRegistry.getInstance();
      const instance = registry.getDefaultService?.() || registry.createService?.(type) || null;
      if (!instance) throw new Error('NFC 服务实例获取失败');
      await instance.initialize();
      setNfc(instance);
      setEmpty(false);
    } catch (e: any) {
      setError(e);
      setNfc(null);
      setEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    initNFC();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initNFC]);

  return { nfc, isLoading, error, empty };
}
