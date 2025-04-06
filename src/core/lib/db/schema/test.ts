import { z } from 'zod';

// 测试类型 Schema
export const TestTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// 测试选项 Schema
export const TestOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  score: z.number(),
  description: z.string().optional(),
});

// 测试问题 Schema
export const TestQuestionSchema = z.object({
  id: z.string(),
  testType: z.string(),
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    score: z.number(),
    description: z.string().optional()
  })),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// 测试结果详情 Schema
export const TestResultDetailsSchema = z.object({
  type: z.string(),
  description: z.string(),
  traits: z.array(z.string()),
  suggestions: z.array(z.string()),
});

// 测试结果 Schema
export const TestResultSchema = z.object({
  id: z.string(),
  testType: z.string(),
  userId: z.string(),
  score: z.number(),
  details: z.record(z.any()),
  completedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// 测试进度 Schema
export const TestProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  testType: z.string(),
  currentQuestionIndex: z.number(),
  answers: z.record(z.string()),
  startedAt: z.date(),
  lastUpdatedAt: z.date()
});

// 导出类型
export type TestType = z.infer<typeof TestTypeSchema>;
export type TestOption = z.infer<typeof TestOptionSchema>;
export type TestQuestion = z.infer<typeof TestQuestionSchema>;
export type TestResultDetails = z.infer<typeof TestResultDetailsSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type TestProgress = z.infer<typeof TestProgressSchema>; 