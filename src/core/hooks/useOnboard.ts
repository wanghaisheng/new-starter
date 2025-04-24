import type { OnboardStep } from '@/core/lib/db/types/onboard.types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/core/hooks/useToast';
import { OnboardServiceRegistry } from '@/core/services/business/onboard/registry/onboard-service-registry';

export function useOnboard(options?: { locale?: string; abTestGroup?: string; platform?: string }) {
  const [steps, setSteps] = useState<OnboardStep[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const router = useRouter();
  const { triggerToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    OnboardServiceRegistry.getDefaultService()
      .getSteps(options)
      .then(data => {
        if (!isMounted) return;
        setSteps(data);
        setEmpty(data.length === 0);
      })
      .catch(e => {
        if (!isMounted) return;
        setError({ type: 'fetch', message: e?.message || '获取引导内容失败' });
        setEmpty(true);
        triggerToast(e?.message || '获取引导内容失败');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [options, triggerToast]);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else router.replace('/mobile/subscribe');
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return {
    steps,
    step,
    loading,
    error,
    empty,
    next,
    prev,
    setStep
  };
}
