import { QuizService } from '@/core/services/business/quiz/service/quiz-service';

describe('QuizService 单元测试', () => {
  const mockAdapter = {
    getQuizzes: jest.fn(() => Promise.resolve([{ id: 'q1', title: 'mock quiz' }])),
    createQuiz: jest.fn(() => Promise.resolve({ id: 'q2', title: 'created' })),
    deleteQuiz: jest.fn(() => Promise.resolve(true)),
  };

  let service: QuizService;

  beforeEach(() => {
    service = new QuizService(mockAdapter as any);
  });

  it('getQuizzes: 应能获取测验列表', async () => {
    const quizzes = await service.getQuizzes();
    expect(Array.isArray(quizzes)).toBe(true);
  });

  it('createQuiz: 应能创建测验', async () => {
    const quiz = await service.createQuiz({ title: 'created' });
    expect(quiz).toBeDefined();
    expect(quiz.title).toBe('created');
  });

  it('deleteQuiz: 应能删除测验', async () => {
    const res = await service.deleteQuiz('q1');
    expect(res).toBe(true);
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    const errorAdapter = {
      getQuizzes: () => { throw new Error('fail'); },
      createQuiz: () => { throw new Error('fail'); },
      deleteQuiz: () => { throw new Error('fail'); },
    };
    const errorService = new QuizService(errorAdapter as any);
    await expect(errorService.getQuizzes()).rejects.toThrow('fail');
    await expect(errorService.createQuiz({})).rejects.toThrow('fail');
    await expect(errorService.deleteQuiz('id')).rejects.toThrow('fail');
  });
});
