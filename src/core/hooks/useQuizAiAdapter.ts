import { useRef, useEffect } from 'react';
import { createQuizAiAdapter, QuizAiAdapterType } from '@/core/services/business/deprecated/quiz/factory/ai-adapter-factory';
import type { IQuizAiAdapter } from '@/core/services/business/deprecated/quiz/types/quiz-service';

/**
 * useQuizAiAdapter - 获取 AI 适配器实例（插件式，可扩展）
 * @param type 适配器类型，默认 default
 * @param apiBaseUrl 可选，部分适配器需要
 */
export function useQuizAiAdapter(type: QuizAiAdapterType = 'default', apiBaseUrl?: string) {
  const adapterRef = useRef<IQuizAiAdapter | null>(null);

  useEffect(() => {
    adapterRef.current = createQuizAiAdapter(type, apiBaseUrl);
  }, [type, apiBaseUrl]);

  return adapterRef.current;
}
