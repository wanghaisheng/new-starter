import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import { useToast } from '@/core/hooks/useToast';

export interface OnboardStep {
  title: string;
  desc: string;
  image: string;
}

const steps: OnboardStep[] = [
  {
    title: '遇见更好的自己',
    desc: '基于八字、性格、兴趣的智能推荐，开启你的专属缘分之旅',
    image: '/assets/onboard-1.png',
  },
  {
    title: '安全真实的社区',
    desc: '实名认证+专业审核，保护你的每一次心动',
    image: '/assets/onboard-2.png',
  },
  {
    title: '高效精准的匹配',
    desc: '多维画像，科学算法，帮你找到最合适的TA',
    image: '/assets/onboard-3.png',
  },
];

export function useOnboard() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { triggerToast } = useToast();

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else router.replace('/mobile/subscribe');
  };

  return {
    step,
    setStep,
    steps,
    next,
  };
}
