import { BaseEntity } from './base';

/**
 * 测试类型枚举
 */
export type TestType = {
  id: string;
  type: 'mbti' | 'bazi' | 'wuxing' | 'tcm' | 'soulmate';
  title: string;
  description: string;
  questionCount: number;
  estimatedTime: number; // 预计完成时间（分钟）
  matchingWeight: number; // 在匹配算法中的权重
  isActive: boolean; // 是否启用
  allowDirectInput?: boolean; // 是否允许直接输入结果（如MBTI初期实现）
  order: number; // 显示顺序
};

/**
 * MBTI维度
 */
export type MBTIDimension = {
  E: number; // 外向
  I: number; // 内向
  S: number; // 感觉
  N: number; // 直觉
  T: number; // 思维
  F: number; // 情感
  J: number; // 判断
  P: number; // 知觉
};

/**
 * MBTI类型
 */
export type MBTIType = 
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

/**
 * 测试问题类型
 */
export type TestQuestion = {
  id: string;
  type: 'single' | 'multiple' | 'scale';
  question: string;
  options?: string[];
  minScale?: number;
  maxScale?: number;
  weight?: number;
};

/**
 * 测试结果
 */
export interface TestResult extends BaseEntity {
  userId: string;
  testId: string;
  testType: TestType['type'];
  score: number;
  details: {
    mbti?: {
      type: MBTIType;
      scores: MBTIDimension;
    };
    bazi?: {
      yearPillar: string;
      monthPillar: string;
      dayPillar: string;
      hourPillar: string;
      elements: string[];
    };
    wuxing?: {
      mainElement: string;
      elementScores: Record<string, number>;
    };
    tcm?: {
      mainType: string;
      types: string[];
    };
    soulmate?: {
      traits: string[];
      values: Record<string, number>;
    };
  };
  answers?: Record<string, any>; // 用户的原始答案
  completedAt: string;
  suggestions?: string[]; // 基于结果的建议
}

/**
 * 测试匹配规则
 */
export interface TestMatchRule extends BaseEntity {
  testType: TestType['type'];
  rules: {
    mbti?: {
      type: MBTIType;
      bestMatches: MBTIType[];
      goodMatches: MBTIType[];
      neutralMatches: MBTIType[];
      challengingMatches: MBTIType[];
    };
    bazi?: {
      // 八字匹配规则
    };
    wuxing?: {
      // 五行匹配规则
    };
    tcm?: {
      // 中医体质匹配规则
    };
    soulmate?: {
      // 灵魂契合度匹配规则
    };
  };
}

export type TestProgress = BaseEntity & {
  userId: string;
  testId: string;
  currentQuestionIndex: number;
  answers: Record<string, number | number[]>;
  startedAt: string;
  lastUpdatedAt: string;
};

export type TestTrait = {
  name: string;
  score: number;
  description: string;
  level: 'low' | 'medium' | 'high';
};

export type TestResultDetails = {
  // 八字命理测试结果
  bazi?: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
    fiveElements: string[];
    luckyElements: string[];
    unluckyElements: string[];
  };
  // 五行人格测试结果
  wuxing?: {
    mainElement: string;
    secondaryElement: string;
    weakElement: string;
    elementScores: Record<string, number>;
  };
  // 中医体质测试结果
  tcm?: {
    mainType: string;
    secondaryTypes: string[];
    recommendations: string[];
    dietSuggestions: string[];
  };
  // 灵魂契合度测试结果
  soulmate?: {
    compatibilityFactors: {
      values: number;
      lifestyle: number;
      communication: number;
      emotional: number;
    };
    idealTraits: string[];
    challengingTraits: string[];
  };
};

export interface ScoringRule extends BaseEntity {
  testId: string;
  trait: string;
  questions: string[];
  weight: number;
} 