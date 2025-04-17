import { QuizService } from '../service/quiz-service';
import { QuizAIService } from '../service/quiz-ai-service';
import { MatchService } from '../../match/service/match-service';
import { Quiz, QuizType, QuizAnswer, QuizResult } from '@/core/lib/db/types/quiz';

// 假设已初始化 quizService/quizAIService/matchService
const quizService = new QuizService(/* ... */);
const quizAIService = new QuizAIService('/api');
const matchService = new MatchService();

/**
 * 提交测评答卷，自动AI分析、落库并联动match
 */
export async function submitQuiz(
  quiz: Quiz,
  quizType: QuizType,
  userId: string,
  answers: QuizAnswer[]
): Promise<QuizResult> {
  // 1. AI分析+落库+联动match
  const result = await quizAIService.analyzeAndSaveQuizResult(
    quiz,
    quizType,
    userId,
    answers,
    async (quizResult) => quizService.saveQuizResult(quizResult),
    matchService
  );
  return result;
}
