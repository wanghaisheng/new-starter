import { BaseRepository } from './base-repository';
import { TestType, TestQuestion, TestResult, TestProgress } from '@/core/lib/db/types/test';
import { TestTypeSchema, TestQuestionSchema, TestResultSchema, TestProgressSchema } from '@/core/lib/db/schema/test';

export class TestTypeRepository extends BaseRepository<TestType> {
  constructor() {
    super('test_types', TestTypeSchema);
  }
}

export class TestQuestionRepository extends BaseRepository<TestQuestion> {
  constructor() {
    super('test_questions', TestQuestionSchema);
  }

  async getByTestType(testType: string): Promise<TestQuestion[]> {
    return this.find({ testType });
  }
}

export class TestResultRepository extends BaseRepository<TestResult> {
  constructor() {
    super('test_results', TestResultSchema);
  }

  async getByUserAndTestType(userId: string, testType: string): Promise<TestResult[]> {
    return this.find({ userId, testType });
  }
}

export class TestProgressRepository extends BaseRepository<TestProgress> {
  constructor() {
    super('test_progress', TestProgressSchema);
  }

  async getByUserAndTestType(userId: string, testType: string): Promise<TestProgress | null> {
    const results = await this.find({ userId, testType });
    return results[0] || null;
  }
} 