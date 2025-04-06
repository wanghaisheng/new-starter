import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { TestType, TestQuestion, TestResult, TestProgress } from '@/core/lib/db/types/test';

/**
 * 测试类型仓储类
 */
export class TestTypeRepository extends BaseRepository<TestType> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'test_types');
  }

  /**
   * 根据类别查找测试类型
   */
  async findByCategory(category: string): Promise<TestType[]> {
    const result = await this.query({
      where: { category }
    });
    return result.data;
  }
}

/**
 * 测试问题仓储类
 */
export class TestQuestionRepository extends BaseRepository<TestQuestion> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'test_questions');
  }

  /**
   * 根据测试类型ID获取所有问题
   */
  async findByTestType(testTypeId: string): Promise<TestQuestion[]> {
    const result = await this.query({
      where: { testTypeId },
      orderBy: { field: 'order', direction: 'asc' }
    });
    return result.data;
  }
}

/**
 * 测试结果仓储类
 */
export class TestResultRepository extends BaseRepository<TestResult> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'test_results');
  }

  /**
   * 根据用户ID和测试类型ID查找测试结果
   */
  async findByUserAndTestType(userId: string, testTypeId: string): Promise<TestResult[]> {
    const result = await this.query({
      where: {
        userId,
        testTypeId
      },
      orderBy: { field: 'completedAt', direction: 'desc' }
    });
    return result.data;
  }

  /**
   * 获取用户最近的测试结果
   */
  async findLatestByUser(userId: string, limit: number = 5): Promise<TestResult[]> {
    const result = await this.query({
      where: { userId },
      orderBy: { field: 'completedAt', direction: 'desc' },
      limit
    });
    return result.data;
  }
}

/**
 * 测试进度仓储类
 */
export class TestProgressRepository extends BaseRepository<TestProgress> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'test_progress');
  }

  /**
   * 根据用户ID和测试类型ID查找测试进度
   */
  async findByUserAndTestType(userId: string, testTypeId: string): Promise<TestProgress | null> {
    const result = await this.query({
      where: {
        userId,
        testTypeId
      }
    });
    return result.data[0] || null;
  }

  /**
   * 获取用户所有进行中的测试
   */
  async findInProgressByUser(userId: string): Promise<TestProgress[]> {
    const result = await this.query({
      where: { userId }
    });
    return result.data;
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
    const progress = await this.findByUserAndTestType(userId, testTypeId);
    if (!progress) {
      return await this.create({
        userId,
        testTypeId,
        currentQuestionIndex,
        answers,
        startedAt: new Date(),
        lastUpdatedAt: new Date()
      });
    }

    const updated = await this.update(progress.id, {
      currentQuestionIndex,
      answers,
      lastUpdatedAt: new Date()
    });

    return updated;
  }
} 