import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuizService } from '@/providers/ServiceProvider';
import type {  IQuizService } from '@/core/services/business/deprecated/quiz/types/quiz-service';
import type { Quiz, QuizQuestion, QuizResult } from '@/core/lib/db/types/quiz.types';
import { useToast } from './useToast';

export interface UseQuizzesResult {
  quizzes: Quiz[];
  loading: boolean;
  error: null | { type: string; message: string };
  empty: boolean;
  fetchQuizzes: () => Promise<void>;
  reloadQuizzes: () => Promise<void>;
}

export function useQuizzes(): UseQuizzesResult {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const serviceRef = useRef<IQuizService | null>(null);

  useEffect(() => {
    // 使用ServiceProvider提供的钩子获取服务实例
    const quizService = useQuizService();
    serviceRef.current = quizService;
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const data = await serviceRef.current.getQuizzes();
      setQuizzes(data);
      setEmpty(data.length === 0);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取测验失败' });
      setEmpty(true);
      triggerToast(err?.message || '获取测验失败');
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  const reloadQuizzes = useCallback(async () => {
    await fetchQuizzes();
  }, [fetchQuizzes]);

  return { quizzes, loading, error, empty, fetchQuizzes, reloadQuizzes };
}

export interface UseQuizQuestionsResult {
  questions: QuizQuestion[];
  loading: boolean;
  error: null | { type: string; message: string };
  empty: boolean;
  fetchQuestions: () => Promise<void>;
}

export function useQuizQuestions(quizId: string): UseQuizQuestionsResult {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const serviceRef = useRef<IQuizService | null>(null);

  useEffect(() => {
    // 使用ServiceProvider提供的钩子获取服务实例
    const quizService = useQuizService();
    serviceRef.current = quizService;
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const data = await serviceRef.current.getQuizQuestions(quizId);
      setQuestions(data);
      setEmpty(data.length === 0);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取题目失败' });
      setEmpty(true);
      triggerToast(err?.message || '获取题目失败');
    } finally {
      setLoading(false);
    }
  }, [quizId, triggerToast]);

  return { questions, loading, error, empty, fetchQuestions };
}

export interface UseQuizResultResult {
  result: QuizResult | null;
  loading: boolean;
  error: null | { type: string; message: string };
  fetchResult: () => Promise<void>;
}

export function useQuizResult(userId: string, quizId: string): UseQuizResultResult {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const { triggerToast } = useToast();
  const serviceRef = useRef<IQuizService | null>(null);

  useEffect(() => {
    // 使用ServiceProvider提供的钩子获取服务实例
    const quizService = useQuizService();
    serviceRef.current = quizService;
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, quizId]);

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const data = await serviceRef.current.getQuizResult(userId, quizId);
      setResult(data);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取测验结果失败' });
      triggerToast(err?.message || '获取测验结果失败');
    } finally {
      setLoading(false);
    }
  }, [userId, quizId, triggerToast]);

  return { result, loading, error, fetchResult };
}
