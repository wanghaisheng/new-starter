import { QuizService } from '@/core/services/business/quiz/service/quiz-service';
import { MockQuizAdapter } from '@/core/services/business/quiz/adapters/mock-quiz-adapter';
import { QuizDataService } from '@/core/services/business/quiz/service/quiz-data-service';

describe('QuizService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const adapter = new MockQuizAdapter();
    const dataService = new QuizDataService(adapter);
    const service = new QuizService(dataService);
    expect(service).toBeDefined();
    // 可选: 调用部分核心方法
    if (service.getQuizzes) {
      const quizzes = await service.getQuizzes();
      expect(Array.isArray(quizzes)).toBe(true);
    }
  });
});
