import { useRef, useEffect } from 'react';
import { createQuizReportAdapter, QuizReportAdapterType } from '@/core/services/business/deprecated/quiz/factory/report-adapter-factory';
import type { IQuizReportAdapter } from '@/core/services/business/deprecated/quiz/types/quiz-service';

/**
 * useQuizReportAdapter - 获取测评报告适配器实例（插件式，可扩展）
 * @param type 适配器类型，默认 default
 */
export function useQuizReportAdapter(type: QuizReportAdapterType = 'default') {
  const adapterRef = useRef<IQuizReportAdapter | null>(null);

  useEffect(() => {
    adapterRef.current = createQuizReportAdapter(type);
  }, [type]);

  return adapterRef.current;
}
