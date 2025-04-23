// æµ‹è¯„ç›¸å…³ç±»åž‹å®šä¹‰
import { BaseEntity } from './base-entity';

// QuizTypeKey 联合类型，所有 quiz 类型唯一 key
export type QuizTypeKey = 'personality' | 'love' | 'career'; // TODO: 补全所有 quiz 类型 key

// æµ‹è¯„ç±»åž‹
export interface QuizType {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  scoringRule: string; // è¯„åˆ†è§„åˆ™æ ‡è¯†
  categoryRule: string; // åˆ†ç±»è§„åˆ™æ ‡è¯†
  // 可选：唯一类型 key
  type: QuizTypeKey;
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
  type: string; // é¢˜åž‹ï¼Œå¦‚single/multi/textç­?  content: string;
  options?: { value: string; label: string; score?: number }[];
  order: number;
}

// æµ‹è¯„ç­”æ¡ˆ
export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  score?: number;
}

// æµ‹è¯„ç»“æžœï¼ˆå�«æ ‡ç­¾ä¸ŽæŠ¥å‘Šï¼‰
export interface QuizResult extends BaseEntity {
  id: string;
  userId: string;
  quizId: string;
  answers: QuizAnswer[];
  tags: string[]; // ç»“æžœæ ‡ç­¾
  report: any; // å®Œæ•´JSONæŠ¥å‘Š
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
