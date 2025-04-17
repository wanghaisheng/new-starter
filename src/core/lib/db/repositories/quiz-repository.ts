import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { 
  QuizType, 
  QuizQuestion, 
  QuizResult, 
  QuizProgress, 
  QuizMatchRule, 
  ScoringRule 
} from '@/core/lib/db/types/quiz';
import { DatabaseError } from '@/core/lib/db/errors/database-error';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

/**
 * 测试类型仓储类
 */
export class QuizTypeRepository extends BaseRepository<QuizType> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'quiz_types');
  }

  /**
   * 根据类别查找测试类型
   * @param category 测试类别
   * @returns 测试类型列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByCategory(category: string): Promise<QuizType[]> {
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
   * 根据评分规则查找测试类型
   * @param scoringRule 评分规则
   * @returns 测试类型列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByScoringRule(scoringRule: string): Promise<QuizType[]> {
    try {
      const result = await this.query({ where: { scoringRule } });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找评分规则为 ${scoringRule} 的测试类型失败`,
        'QUERY_ERROR',
        { scoringRule, error }
      );
    }
  }

  /**
   * 根据分类规则查找测试类型
   * @param categoryRule 分类规则
   * @returns 测试类型列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByCategoryRule(categoryRule: string): Promise<QuizType[]> {
    try {
      const result = await this.query({ where: { categoryRule } });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找分类规则为 ${categoryRule} 的测试类型失败`,
        'QUERY_ERROR',
        { categoryRule, error }
      );
    }
  }

  /**
   * 获取所有启用的测试类型
   * @returns 启用的测试类型列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findActiveQuizs(): Promise<QuizType[]> {
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
export class QuizQuestionRepository extends BaseRepository<QuizQuestion> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'quiz_questions');
  }

  /**
   * 根据测试类型ID获取所有问题
   * @param quizTypeId 测试类型ID
   * @returns 问题列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByQuizType(quizTypeId: string): Promise<QuizQuestion[]> {
    try {
      const result = await this.query({
        where: { quizTypeId },
        orderBy: { field: 'order', direction: 'asc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取测试类型 ${quizTypeId} 的问题失败`,
        'QUERY_ERROR',
        { quizTypeId, error }
      );
    }
  }

  /**
   * 根据测评ID获取所有问题
   * @param quizId 测评ID
   * @returns 问题列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByQuizId(quizId: string): Promise<QuizQuestion[]> {
    try {
      const result = await this.query({ where: { quizId }, orderBy: { field: 'order', direction: 'asc' } });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取测评 ${quizId} 的问题失败`,
        'QUERY_ERROR',
        { quizId, error }
      );
    }
  }

  /**
   * 批量创建测试问题
   * @param questions 问题列表
   * @returns 创建的问题列表
   * @throws {DatabaseError} 当创建失败时抛出
   */
  async bulkCreate(questions: QuizQuestion[]): Promise<QuizQuestion[]> {
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
export class QuizResultRepository extends BaseRepository<QuizResult> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'quiz_results');
  }

  /**
   * 根据用户ID和测试类型ID查找测试结果
   * @param userId 用户ID
   * @param quizTypeId 测试类型ID
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserAndQuizType(userId: string, quizTypeId: string): Promise<QuizResult[]> {
    try {
      const result = await this.query({
        where: {
          userId,
          quizTypeId
        },
        orderBy: { field: 'completedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 的测试类型 ${quizTypeId} 的结果失败`,
        'QUERY_ERROR',
        { userId, quizTypeId, error }
      );
    }
  }

  /**
   * 根据用户ID和测评ID查找结果
   * @param userId 用户ID
   * @param quizId 测评ID
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserAndQuiz(userId: string, quizId: string): Promise<QuizResult[]> {
    try {
      const result = await this.query({ where: { userId, quizId } });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找用户 ${userId} 在测评 ${quizId} 的结果失败`,
        'QUERY_ERROR',
        { userId, quizId, error }
      );
    }
  }

  /**
   * 获取用户所有结果
   * @param userId 用户ID
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUser(userId: string): Promise<QuizResult[]> {
    try {
      const result = await this.query({ where: { userId } });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找用户 ${userId} 的所有测评结果失败`,
        'QUERY_ERROR',
        { userId, error }
      );
    }
  }

  /**
   * 获取测评所有用户结果
   * @param quizId 测评ID
   * @returns 测试结果列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByQuiz(quizId: string): Promise<QuizResult[]> {
    try {
      const result = await this.query({ where: { quizId } });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `查找测评 ${quizId} 的所有用户结果失败`,
        'QUERY_ERROR',
        { quizId, error }
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
  async findLaquizByUser(userId: string, limit: number = 5): Promise<QuizResult[]> {
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
  async findUserQuizHistory(userId: string, page: number = 1, pageSize: number = 10): Promise<QuizResult[]> {
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
export class QuizProgressRepository extends BaseRepository<QuizProgress> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'quiz_progress');
  }

  /**
   * 根据用户ID和测试类型ID查找测试进度
   * @param userId 用户ID
   * @param quizTypeId 测试类型ID
   * @returns 测试进度或null
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserAndQuizType(userId: string, quizTypeId: string): Promise<QuizProgress | null> {
    try {
      const result = await this.query({
        where: {
          userId,
          quizId: quizTypeId
        }
      });
      return result.data[0] || null;
    } catch (error) {
      throw new DatabaseError(
        `获取用户 ${userId} 的测试类型 ${quizTypeId} 的进度失败`,
        'QUERY_ERROR',
        { userId, quizTypeId, error }
      );
    }
  }

  /**
   * 获取用户所有进行中的测试
   * @param userId 用户ID
   * @returns 测试进度列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findInProgressByUser(userId: string): Promise<QuizProgress[]> {
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
   * @param quizTypeId 测试类型ID
   * @param currentQuestionIndex 当前问题索引
   * @param answers 答案记录
   * @returns 更新后的测试进度
   * @throws {DatabaseError} 当更新失败时抛出
   */
  async updateProgress(
    userId: string,
    quizTypeId: string,
    currentQuestionIndex: number,
    answers: Record<string, number | number[]>
  ): Promise<QuizProgress> {
    try {
      const progress = await this.findByUserAndQuizType(userId, quizTypeId);
      if (!progress) {
        const newProgress: Omit<QuizProgress, keyof BaseEntity> = {
          userId,
          quizId: quizTypeId,
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
            { userId, quizTypeId, currentQuestionIndex }
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
          { userId, quizTypeId, currentQuestionIndex }
        );
      }

      return updatedProgress;
    } catch (error) {
      throw new DatabaseError(
        `更新用户 ${userId} 的测试类型 ${quizTypeId} 的进度失败`,
        'UPDATE_ERROR',
        { userId, quizTypeId, currentQuestionIndex, error }
      );
    }
  }
}

/**
 * 测试匹配规则仓储类
 */
export class QuizMatchRuleRepository extends BaseRepository<QuizMatchRule> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'quiz_match_rules');
  }

  /**
   * 根据测试类型获取匹配规则
   * @param quizType 测试类型
   * @returns 匹配规则
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByQuizType(quizType: QuizType['type']): Promise<QuizMatchRule | null> {
    try {
      const result = await this.query({
        where: { quizType },
        limit: 1
      });
      return result.data[0] || null;
    } catch (error) {
      throw new DatabaseError(
        `获取测试类型 ${quizType} 的匹配规则失败`,
        'QUERY_ERROR',
        { quizType, error }
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
   * @param quizId 测试ID
   * @returns 评分规则列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByQuizId(quizId: string): Promise<ScoringRule[]> {
    try {
      const result = await this.query({
        where: { quizId }
      });
      return result.data;
    } catch (error) {
      throw new DatabaseError(
        `获取测试 ${quizId} 的评分规则失败`,
        'QUERY_ERROR',
        { quizId, error }
      );
    }
  }
}