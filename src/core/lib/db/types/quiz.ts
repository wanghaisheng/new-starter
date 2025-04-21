// Quiz 数据模型和类型定义，原 test 类型迁移

// 测评类型
  // type: 'mbti' | 'bazi' | 'wuxing' | 'tcm' | 'soulmate';

export interface QuizType {
  id: string;
  name: string;
  description?: string;
  scoringRule: string; // 评分规则标识
  categoryRule: string; // 分类规则标识
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  type: QuizType;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: string; // 题型，如single/multi/text等
  content: string;
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
export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  answers: QuizAnswer[];
  tags: string[]; // 结果标签
  report: any; // 完整JSON报告
  score: number;
  createdAt: string;
  updatedAt?: string;
}
