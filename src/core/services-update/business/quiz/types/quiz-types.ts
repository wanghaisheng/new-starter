import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

export type { Quiz, QuizResult, QuizQuestion };

export interface QuizWithQuestions {
  quiz: Quiz | null;
  questions: QuizQuestion[];
}

export interface UserQuizDetail {
  quiz: Quiz | null;
  result: QuizResult | null;
  questions: QuizQuestion[];
}
