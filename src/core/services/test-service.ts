import { TestType, TestQuestion, TestProgress, TestResult, TestResultDetails } from '@/core/lib/db/types';
import { DataServiceFactory } from '@/core/lib/db/factory';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { BaseService } from '@/core/services/base-service';

export class TestService extends BaseService {
  private static instance: TestService;
  private db: IDatabaseClient;

  private constructor() {
    super();
    this.db = DataServiceFactory.getInstance().getClient();
  }

  public static getInstance(): TestService {
    if (!TestService.instance) {
      TestService.instance = new TestService();
    }
    return TestService.instance;
  }

  async getTestTypes(): Promise<TestType[]> {
    return this.db.findAll<TestType>('testTypes');
  }

  async getTestQuestions(testTypeId: string): Promise<TestQuestion[]> {
    const testType = await this.db.findById<TestType>('testTypes', testTypeId);
    return testType?.questions || [];
  }

  async getTestProgress(userId: string, testTypeId: string): Promise<TestProgress | null> {
    const progress = await this.db.findOne<TestProgress>('testProgress', {
      userId,
      testTypeId,
    });
    return progress || null;
  }

  async saveTestProgress(progress: Partial<TestProgress>): Promise<TestProgress> {
    if (progress.id) {
      return this.db.update<TestProgress>('testProgress', progress.id, progress);
    } else {
      return this.db.create<TestProgress>('testProgress', {
        ...progress,
        startedAt: new Date(),
      } as TestProgress);
    }
  }

  async saveTestResult(result: Omit<TestResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestResult> {
    return this.db.create<TestResult>('testResults', {
      ...result,
      completedAt: new Date(),
    });
  }

  async getTestResult(userId: string, testTypeId: string): Promise<TestResult | null> {
    const result = await this.db.findOne<TestResult>('testResults', {
      userId,
      testTypeId,
    });
    return result || null;
  }

  async calculateScore(questions: TestQuestion[], answers: Record<string, string>): Promise<number> {
    let totalScore = 0;
    let totalWeight = 0;

    questions.forEach((question) => {
      const answerId = answers[question.id];
      if (answerId) {
        const option = question.options.find((opt) => opt.id === answerId);
        if (option) {
          totalScore += option.score * question.weight;
          totalWeight += question.weight;
        }
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  async generateResultDetails(testTypeId: string, score: number): Promise<TestResultDetails> {
    const testType = await this.db.findById<TestType>('testTypes', testTypeId);
    if (!testType) {
      throw new Error('Test type not found');
    }

    const rule = testType.scoringRules.find(
      (rule) => score >= rule.minScore && score <= rule.maxScore
    );

    if (!rule) {
      throw new Error('No matching scoring rule found');
    }

    return {
      type: rule.type,
      description: rule.description,
      traits: rule.traits,
      suggestions: rule.suggestions,
    };
  }
} 