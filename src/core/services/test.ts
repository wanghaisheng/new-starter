import { DatabaseService } from '@/core/lib/db/service';
import { TestType, TestQuestion, TestResult, TestProgress, TestResultDetails } from '@/core/lib/db/types/test';
import { TestTypeRepository, TestQuestionRepository, TestResultRepository, TestProgressRepository } from '@/core/lib/db/repositories/test-repository';

/**
 * 测试服务类
 * 处理测试相关的业务逻辑
 */
export class TestService {
  private static instance: TestService;
  private dbService: DatabaseService;
  private testTypeRepo: TestTypeRepository;
  private testQuestionRepo: TestQuestionRepository;
  private testResultRepo: TestResultRepository;
  private testProgressRepo: TestProgressRepository;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.testTypeRepo = new TestTypeRepository(this.dbService.getRawClient());
    this.testQuestionRepo = new TestQuestionRepository(this.dbService.getRawClient());
    this.testResultRepo = new TestResultRepository(this.dbService.getRawClient());
    this.testProgressRepo = new TestProgressRepository(this.dbService.getRawClient());
  }

  public static getInstance(): TestService {
    if (!TestService.instance) {
      TestService.instance = new TestService();
    }
    return TestService.instance;
  }

  /**
   * 获取所有测试类型
   */
  async getTestTypes(): Promise<TestType[]> {
    return await this.testTypeRepo.findAll();
  }

  /**
   * 根据类别获取测试类型
   */
  async getTestTypesByCategory(category: string): Promise<TestType[]> {
    return await this.testTypeRepo.findByCategory(category);
  }

  /**
   * 获取测试问题
   */
  async getTestQuestions(testTypeId: string): Promise<TestQuestion[]> {
    return await this.testQuestionRepo.findByTestType(testTypeId);
  }

  /**
   * 获取或创建测试进度
   */
  async getOrCreateProgress(userId: string, testTypeId: string): Promise<TestProgress> {
    const progress = await this.testProgressRepo.findByUserAndTestType(userId, testTypeId);
    if (progress) {
      return progress;
    }

    return await this.testProgressRepo.create({
      userId,
      testTypeId,
      currentQuestionIndex: 0,
      answers: {},
      startedAt: new Date(),
      lastUpdatedAt: new Date()
    });
  }

  /**
   * 更新测试进度
   */
  async updateProgress(
    userId: string,
    testTypeId: string,
    currentQuestionIndex: number,
    answers: Record<string, string>
  ): Promise<TestProgress> {
    return await this.testProgressRepo.updateProgress(
      userId,
      testTypeId,
      currentQuestionIndex,
      answers
    );
  }

  /**
   * 计算测试分数
   */
  private async calculateScore(testTypeId: string, answers: Record<string, string>): Promise<number> {
    const questions = await this.getTestQuestions(testTypeId);
    let totalScore = 0;

    for (const question of questions) {
      const selectedOptionId = answers[question.id];
      if (selectedOptionId) {
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
      }
    }

    return totalScore;
  }

  /**
   * 生成测试结果详情
   */
  private generateResultDetails(score: number): TestResultDetails {
    let level: TestResultDetails['level'];
    let feedback: string;

    if (score >= 80) {
      level = '优秀';
      feedback = '你的表现非常出色！继续保持这种状态。';
    } else if (score >= 60) {
      level = '良好';
      feedback = '你的表现不错，但还有提升的空间。';
    } else {
      level = '需要改进';
      feedback = '建议你多加练习，相信你一定会有进步。';
    }

    return {
      score,
      level,
      feedback
    };
  }

  /**
   * 保存测试结果
   */
  async saveTestResult(userId: string, testTypeId: string, answers: Record<string, string>): Promise<TestResult> {
    // 计算分数
    const score = await this.calculateScore(testTypeId, answers);
    
    // 生成结果详情
    const details = this.generateResultDetails(score);

    // 保存结果
    const result = await this.testResultRepo.create({
      userId,
      testTypeId,
      answers,
      score,
      details,
      completedAt: new Date()
    });

    return result;
  }

  /**
   * 获取用户的测试结果
   */
  async getTestResults(userId: string, testTypeId: string): Promise<TestResult[]> {
    return await this.testResultRepo.findByUserAndTestType(userId, testTypeId);
  }

  /**
   * 获取用户最近的测试结果
   */
  async getLatestResults(userId: string, limit: number = 5): Promise<TestResult[]> {
    return await this.testResultRepo.findLatestByUser(userId, limit);
  }

  /**
   * 获取用户所有进行中的测试
   */
  async getInProgressTests(userId: string): Promise<TestProgress[]> {
    return await this.testProgressRepo.findInProgressByUser(userId);
  }
} 