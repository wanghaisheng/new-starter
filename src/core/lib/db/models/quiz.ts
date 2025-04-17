import { QuizType, Quiz, QuizQuestion, QuizAnswer, QuizResult } from '../types/quiz';

export class QuizTypeModel implements QuizType {
  id: string;
  name: string;
  description?: string;
  scoringRule: string;
  categoryRule: string;
  constructor(data: QuizType) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.scoringRule = data.scoringRule;
    this.categoryRule = data.categoryRule;
  }
}

export class QuizModel implements Quiz {
  id: string;
  title: string;
  type: QuizType;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
  constructor(data: Quiz) {
    this.id = data.id;
    this.title = data.title;
    this.type = data.type;
    this.questions = data.questions;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }
}

export class QuizQuestionModel implements QuizQuestion {
  id: string;
  quizId: string;
  type: string;
  content: string;
  options?: { value: string; label: string; score?: number }[];
  order: number;
  constructor(data: QuizQuestion) {
    this.id = data.id;
    this.quizId = data.quizId;
    this.type = data.type;
    this.content = data.content;
    this.options = data.options;
    this.order = data.order;
  }
}

export class QuizAnswerModel implements QuizAnswer {
  questionId: string;
  answer: string | string[];
  score?: number;
  constructor(data: QuizAnswer) {
    this.questionId = data.questionId;
    this.answer = data.answer;
    this.score = data.score;
  }
}

export class QuizResultModel implements QuizResult {
  id: string;
  userId: string;
  quizId: string;
  answers: QuizAnswer[];
  tags: string[];
  report: any;
  score: number;
  createdAt: string;
  updatedAt?: string;
  constructor(data: QuizResult) {
    this.id = data.id;
    this.userId = data.userId;
    this.quizId = data.quizId;
    this.answers = data.answers;
    this.tags = data.tags;
    this.report = data.report;
    this.score = data.score;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
