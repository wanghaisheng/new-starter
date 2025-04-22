// 测评相关类型定义
import { BaseEntity } from './base-entity';

// 测评类型
export interface QuizType {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  scoringRule: string; // 评分规则标识
  categoryRule: string; // 分类规则标识
}

export interface Quiz extends BaseEntity {
  id: string;
  title: string;
  description?: string;
  type: QuizType;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  createdAt: string;
  updatedAt: string;
  quizId: string;
  type: string; // 题型，如single/multi/text�?  content: string;
  options?: { value: string; label: string; score?: number }[];
  order: number;
}

// 测评答案
export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  score?: number;
}

// 测评结果（含标签与报告）
export interface QuizResult extends BaseEntity {
  id: string;
  userId: string;
  quizId: string;
  answers: QuizAnswer[];
  tags: string[]; // 结果标签
  report: any; // 完整JSON报告
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizProgress extends BaseEntity {
  userId: string;
  quizId: string;
  currentQuestionIndex: number;
  answers: Record<string, number | number[]>;
}

export interface QuizMatchRule extends BaseEntity {
  quizType: string;
  rule: string;
  description?: string;
}
