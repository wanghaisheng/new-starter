import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TestService } from '@/core/services/data/quiz-service';
import { useAuth } from '@/core/hooks/useAuth';
import type { 
  TestType, 
  TestQuestion, 
  TestProgress, 
  TestResult,
  TestResultDetails 
} from '@/core/lib/db/types/test';

// 测试类型选择 hook
export function useTestTypes() {
  const { isAuthenticated } = useAuth();
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTestTypes() {
      if (!isAuthenticated) return;

      try {
        const service = TestService.getInstance();
        await service.initialize();
        const types = await service.getTestTypes();
        setTestTypes(types);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test types'));
      } finally {
        setLoading(false);
      }
    }

    loadTestTypes();
  }, [isAuthenticated]);

  return { testTypes, loading, error };
}

// 测试问题 hook
export function useTestQuestions(testTypeId: string) {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!isAuthenticated || !testTypeId) return;

      try {
        const service = TestService.getInstance();
        await service.initialize();
        const testQuestions = await service.getTestQuestions(testTypeId);
        setQuestions(testQuestions);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test questions'));
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [isAuthenticated, testTypeId]);

  return { questions, loading, error };
}

// 测试进度 hook
export function useTestProgress(testTypeId: string) {
  const { isAuthenticated, user } = useAuth();
  const [progress, setProgress] = useState<TestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProgress() {
      if (!isAuthenticated || !user?.id || !testTypeId) return;
      
      try {
        const service = TestService.getInstance();
        await service.initialize();
        const testProgress = await service.getTestProgress(user.id, testTypeId);
        setProgress(testProgress);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test progress'));
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [isAuthenticated, user?.id, testTypeId]);

  const updateProgress = useCallback(async (currentQuestionIndex: number, answers: Record<string, number | number[]>) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('Authentication required');
    }

    try {
      const service = TestService.getInstance();
      await service.initialize();
      const updatedProgress = await service.saveTestProgress({
        userId: user.id,
        testId: testTypeId,
        currentQuestionIndex,
        answers,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      });
      setProgress(updatedProgress);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update test progress'));
      throw err;
    }
  }, [isAuthenticated, user?.id, testTypeId]);

  return { progress, loading, error, updateProgress };
}

// 测试结果 hook
export function useTestResult(testTypeId: string) {
  const { isAuthenticated, user } = useAuth();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!isAuthenticated || !user?.id || !testTypeId) return;

      try {
        const service = TestService.getInstance();
        await service.initialize();
        const testResult = await service.getTestResult(user.id, testTypeId);
        setResult(testResult);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test result'));
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [isAuthenticated, user?.id, testTypeId]);

  const saveResult = useCallback(async (score: number, details: TestResultDetails) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('Authentication required');
    }

    try {
      const service = TestService.getInstance();
      await service.initialize();
      const newResult = await service.saveTestResult({
        userId: user.id,
        testId: testTypeId,
        testType: testTypeId as TestType['type'],
        score,
        details: {
          bazi: details.bazi ? {
            yearPillar: details.bazi.yearPillar,
            monthPillar: details.bazi.monthPillar,
            dayPillar: details.bazi.dayPillar,
            hourPillar: details.bazi.hourPillar,
            elements: details.bazi.fiveElements
          } : undefined,
          wuxing: details.wuxing ? {
            mainElement: details.wuxing.mainElement,
            elementScores: details.wuxing.elementScores
          } : undefined,
          tcm: details.tcm ? {
            mainType: details.tcm.mainType,
            types: details.tcm.secondaryTypes
          } : undefined,
          soulmate: details.soulmate ? {
            traits: details.soulmate.idealTraits,
            values: {
              values: details.soulmate.compatibilityFactors.values,
              lifestyle: details.soulmate.compatibilityFactors.lifestyle,
              communication: details.soulmate.compatibilityFactors.communication,
              emotional: details.soulmate.compatibilityFactors.emotional
            }
          } : undefined
        },
        completedAt: new Date().toISOString()
      });
      setResult(newResult);
      return newResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save test result'));
      throw err;
    }
  }, [isAuthenticated, user?.id, testTypeId]);

  return { result, loading, error, saveResult };
}

// 测试导航 hook
export function useTestNavigation() {
  const router = useRouter();

  const navigateToTest = useCallback((testTypeId: string) => {
    router.push(`/tests/${testTypeId}`);
  }, [router]);

  const navigateToResult = useCallback((testTypeId: string) => {
    router.push(`/tests/${testTypeId}/result`);
  }, [router]);

  const navigateToMatch = useCallback((testTypeId: string) => {
    router.push(`/match?testType=${testTypeId}`);
  }, [router]);

  return { navigateToTest, navigateToResult, navigateToMatch };
} 