import { BaseEntity } from './base-entity';

export interface TestType extends BaseEntity {
  name: string;
  description: string;
  icon: string;
  color: string;
  questions: TestQuestion[];
  scoringRules: ScoringRule[];
}

export interface TestQuestion extends BaseEntity {
  testTypeId: string;
  question: string;
  options: TestOption[];
  order: number;
}

export interface TestOption extends BaseEntity {
  questionId: string;
  text: string;
  score: number;
  description?: string;
}

export interface TestProgress extends BaseEntity {
  userId: string;
  testTypeId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  startedAt: Date;
}

export interface TestResult extends BaseEntity {
  userId: string;
  testTypeId: string;
  score: number;
  details: TestResultDetails;
  completedAt: Date;
}

export interface TestResultDetails {
  traits: {
    name: string;
    score: number;
    description: string;
  }[];
  suggestions: string[];
}

export interface ScoringRule {
  trait: string;
  questions: string[];
  weight: number;
} 