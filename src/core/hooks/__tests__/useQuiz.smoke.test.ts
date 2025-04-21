import { renderHook } from '@testing-library/react';
import { useQuiz } from '@/core/hooks/useQuiz';
import React from 'react';
import { vi } from 'vitest';

// mock QuizService
vi.mock('@/core/services/business/quiz/service/quiz-service', () => ({
  QuizService: vi.fn().mockImplementation(() => ({
    getQuizzes: vi.fn(() => Promise.resolve([{ id: 'quiz1', title: 'Mock Quiz' }]))
  }))
}));

describe('useQuiz smoke test', () => {
  it('should not throw and return an object with loading/error/empty', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useQuiz(), {});
    expect(result.current).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect('empty' in result.current).toBe(true);
    // 主流程数据
    if (!result.current.loading && !result.current.error) {
      expect(Array.isArray(result.current.quizzes)).toBe(true);
    }
  });
});
