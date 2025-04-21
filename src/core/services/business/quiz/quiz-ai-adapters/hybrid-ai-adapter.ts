import { IAIAdapter } from './ai-adapter';
import { MockAIAdapter } from './mock-ai-adapter';
import { DefaultAIAdapter } from './default-ai-adapter';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

/**
 * 混合 AI Adapter：本地优先，远程兜底
 */
export class HybridAIAdapter implements IAIAdapter {
  private mock: MockAIAdapter;
  private remote: DefaultAIAdapter;
  constructor(apiBaseUrl?: string) {
    this.mock = new MockAIAdapter();
    this.remote = new DefaultAIAdapter(apiBaseUrl || '');
  }
  async analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model?: string,
    extraPrompt?: string
  ) {
    // 优先本地，若无结果再远程
    try {
      const local = await this.mock.analyzeQuizWithAI(quiz, quizType, answers, model, extraPrompt);
      if (local?.result) return local;
    } catch {}
    return this.remote.analyzeQuizWithAI(quiz, quizType, answers, model, extraPrompt);
  }
}
