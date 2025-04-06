import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { TestType, TestQuestion, TestResult, TestProgress, TestMatchRule, ScoringRule } from '@/core/lib/db/types/test';
import { DatabaseError } from '@/core/lib/db/errors/database-error';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

/**
 * 测试类型仓储类
 */
export class TestTypeRepository extends BaseRepository<TestType> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'test_types');
  }

  /**
   * 根据类别查找测试类型
   * @param category 测试类别
   * @returns 测试类型列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByCategory(category: string): Promise<TestType[]> {
    try {
      const result = await this.query({
        where: { category }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找类别为 ${category} 的测试类型失败`,
        'QUERY_ERROR',
        { category, error }
      );
    }
  }

  /**
   * 获取所有启用的测试类型
   * @returns 启用的测试类型列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findActiveTests(): Promise<TestType[]> {
    try {
      const result = await this.query({
        where: { isActive: true },
        orderBy: { field: 'order', direction: 'asc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        '获取启用的测试类型失败',
        'QUERY_ERROR',
        { error }
      );
    }
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
   * @param testTypeId 测试类型ID
   * @returns 问题列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByTestType(testTypeId: string): Promise<TestQuestion[]> {
    try {
      const result = await this.query({
        where: { testTypeId },
        orderBy: { field: 'order', direction: 'asc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取测试类型 ${testTypeId} 的问题失败`,
        'QUERY_ERROR',
        { testTypeId, error }
      );
    }
  }

  /**
   * 批量创建测试问题
   * @param questions 问题列表
   * @returns 创建的问题列表
   * @throws {DatabaseError} 当创建失败时抛出
   */
  async bulkCreate(questions: TestQuestion[]): Promise<TestQuestion[]> {
    try {
      const operations = questions.map(question => ({
        type: 'add' as const,
        data: question
      }));
      await this.batch(operations);
      return questions;
    } catch (error) {
      throw new DatabaseError(
        '批量创建测试问题失败',
        'BATCH_OPERATION_ERROR',
        { error }
      );
    }
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
   * @param userId 用户ID
   * @param testTypeId 测试类型ID
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserAndTestType(userId: string, testTypeId: string): Promise<TestResult[]> {
    try {
      const result = await this.query({
        where: {
          userId,
          testTypeId
        },
        orderBy: { field: 'completedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 的测试类型 ${testTypeId} 的结果失败`,
        'QUERY_ERROR',
        { userId, testTypeId, error }
      );
    }
  }

  /**
   * 获取用户最近的测试结果
   * @param userId 用户ID
   * @param limit 限制数量
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findLatestByUser(userId: string, limit: number = 5): Promise<TestResult[]> {
    try {
      const result = await this.query({
        where: { userId },
        orderBy: { field: 'completedAt', direction: 'desc' },
        limit
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 最近的测试结果失败`,
        'QUERY_ERROR',
        { userId, limit, error }
      );
    }
  }

  /**
   * 获取用户的测试历史
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findUserTestHistory(userId: string, page: number = 1, pageSize: number = 10): Promise<TestResult[]> {
    try {
      const result = await this.query({
        where: { userId },
        orderBy: { field: 'completedAt', direction: 'desc' },
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 的测试历史失败`,
        'QUERY_ERROR',
        { userId, page, pageSize, error }
      );
    }
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
   * @param userId 用户ID
   * @param testTypeId 测试类型ID
   * @returns 测试进度或null
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserAndTestType(userId: string, testTypeId: string): Promise<TestProgress | null> {
    try {
      const result = await this.query({
        where: {
          userId,
          testId: testTypeId
        }
      });
      return result.data[0] || null;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 的测试类型 ${testTypeId} 的进度失败`,
        'QUERY_ERROR',
        { userId, testTypeId, error }
      );
    }
  }

  /**
   * 获取用户所有进行中的测试
   * @param userId 用户ID
   * @returns 测试进度列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findInProgressByUser(userId: string): Promise<TestProgress[]> {
    try {
      const result = await this.query({
        where: { userId }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 进行中的测试失败`,
        'QUERY_ERROR',
        { userId, error }
      );
    }
  }

  /**
   * 更新测试进度
   * @param userId 用户ID
   * @param testTypeId 测试类型ID
   * @param currentQuestionIndex 当前问题索引
   * @param answers 答案记录
   * @returns 更新后的测试进度
   * @throws {DatabaseError} 当更新失败时抛出
   */
  async updateProgress(
    userId: string,
    testTypeId: string,
    currentQuestionIndex: number,
    answers: Record<string, number | number[]>
  ): Promise<TestProgress> {
    try {
      const progress = await this.findByUserAndTestType(userId, testTypeId);
      if (!progress) {
        const newProgress: Omit<TestProgress, keyof BaseEntity> = {
          userId,
          testId: testTypeId,
          currentQuestionIndex,
          answers,
          startedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        };
        const created = await this.create(newProgress);
        if (!created) {
          throw new DatabaseError(
            '创建测试进度失败',
            'CREATE_ERROR',
            { userId, testTypeId, currentQuestionIndex }
          );
        }
        return created;
      }

      const updateData = {
        currentQuestionIndex,
        answers,
        lastUpdatedAt: new Date().toISOString()
      };

      await this.update(progress.id, updateData);
      
      // 重新获取更新后的进度
      const updatedProgress = await this.findById(progress.id);
      if (!updatedProgress) {
        throw new DatabaseError(
          '更新测试进度失败',
          'UPDATE_ERROR',
          { userId, testTypeId, currentQuestionIndex }
        );
      }

      return updatedProgress;
    } catch (error) {
      throw new DatabaseError(
        `更新用户 ${userId} 的测试类型 ${testTypeId} 的进度失败`,
        'UPDATE_ERROR',
        { userId, testTypeId, currentQuestionIndex, error }
      );
    }
  }
}

/**
 * 测试匹配规则仓储类
 */
export class TestMatchRuleRepository extends BaseRepository<TestMatchRule> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'test_match_rules');
  }

  /**
   * 根据测试类型获取匹配规则
   * @param testType 测试类型
   * @returns 匹配规则
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByTestType(testType: TestType['type']): Promise<TestMatchRule | null> {
    try {
      const result = await this.query({
        where: { testType },
        limit: 1
      });
      return result.data[0] || null;
    } catch (error) {
      throw new DatabaseError(
        `获取测试类型 ${testType} 的匹配规则失败`,
        'QUERY_ERROR',
        { testType, error }
      );
    }
  }
}

/**
 * 评分规则仓储类
 */
export class ScoringRuleRepository extends BaseRepository<ScoringRule> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'scoring_rules');
  }

  /**
   * 根据测试ID获取评分规则
   * @param testId 测试ID
   * @returns 评分规则列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByTestId(testId: string): Promise<ScoringRule[]> {
    try {
      const result = await this.query({
        where: { testId }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取测试 ${testId} 的评分规则失败`,
        'QUERY_ERROR',
        { testId, error }
      );
    }
  }
} 