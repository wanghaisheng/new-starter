import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TestService } from '@/core/services/test-service';
import { useUser } from '@/core/hooks/useUser';
import type { 
  TestType, 
  TestQuestion, 
  TestProgress, 
  TestResult,
  TestResultDetails 
} from '@/core/lib/db/types';

// 测试类型选择 hook
export function useTestTypes() {
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTestTypes() {
      try {
        const service = TestService.getInstance();
        const types = await service.getTestTypes();
        setTestTypes(types);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test types'));
      } finally {
        setLoading(false);
      }
    }

    loadTestTypes();
  }, []);

  return { testTypes, loading, error };
}

// 测试问题 hook
export function useTestQuestions(testTypeId: string) {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const service = TestService.getInstance();
        const testQuestions = await service.getTestQuestions(testTypeId);
        setQuestions(testQuestions);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test questions'));
      } finally {
        setLoading(false);
      }
    }

    if (testTypeId) {
      loadQuestions();
    }
  }, [testTypeId]);

  return { questions, loading, error };
}

// 测试进度 hook
export function useTestProgress(testTypeId: string) {
  const { user } = useUser();
  const [progress, setProgress] = useState<TestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProgress() {
      if (!user?.id) return;
      
      try {
        const service = TestService.getInstance();
        const testProgress = await service.getTestProgress(user.id, testTypeId);
        setProgress(testProgress);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test progress'));
      } finally {
        setLoading(false);
      }
    }

    if (user?.id && testTypeId) {
      loadProgress();
    }
  }, [user?.id, testTypeId]);

  const updateProgress = async (currentQuestionIndex: number, answers: Record<string, string>) => {
    if (!user?.id) return;

    try {
      const service = TestService.getInstance();
      const updatedProgress = await service.saveTestProgress({
        userId: user.id,
        testTypeId,
        currentQuestionIndex,
        answers,
        startedAt: new Date()
      });
      setProgress(updatedProgress);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update test progress'));
    }
  };

  return { progress, loading, error, updateProgress };
}

// 测试结果 hook
export function useTestResult(testTypeId: string) {
  const { user } = useUser();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!user?.id) return;

      try {
        const service = TestService.getInstance();
        const testResult = await service.getTestResult(user.id, testTypeId);
        setResult(testResult);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test result'));
      } finally {
        setLoading(false);
      }
    }

    if (user?.id && testTypeId) {
      loadResult();
    }
  }, [user?.id, testTypeId]);

  const saveResult = async (score: number, details: TestResultDetails) => {
    if (!user?.id) return;

    try {
      const service = TestService.getInstance();
      const newResult = await service.saveTestResult({
        userId: user.id,
        testTypeId,
        score,
        details,
        completedAt: new Date()
      });
      setResult(newResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save test result'));
    }
  };

  return { result, loading, error, saveResult };
}

// 测试导航 hook
export function useTestNavigation() {
  const router = useRouter();

  const navigateToTest = (testTypeId: string) => {
    router.push(`/tests/${testTypeId}`);
  };

  const navigateToResult = (testTypeId: string) => {
    router.push(`/tests/${testTypeId}/result`);
  };

  const navigateToMatch = (testTypeId: string) => {
    router.push(`/match?testType=${testTypeId}`);
  };

  return { navigateToTest, navigateToResult, navigateToMatch };
} 