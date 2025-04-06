import { TestType, TestQuestion, TestProgress, TestResult, TestResultDetails, ScoringRule } from '@/core/lib/db/types/test';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { IDataService } from '@/core/lib/db/interfaces';
import { NetworkService } from './network-service';
import type { TestMatchRule, MBTIType, MBTIDimension } from '@/core/lib/db/types/test';
import type { User } from '@/core/lib/db/types/user';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { DatabaseService } from '@/core/services/database-service';

/**
 * 测试服务接口
 * 定义测试相关的服务方法
 */
export interface ITestService {
  initialize(): Promise<void>;
  getTestTypes(): Promise<TestType[]>;
  getTestQuestions(testId: string): Promise<TestQuestion[]>;
  getTestProgress(userId: string, testId: string): Promise<TestProgress | null>;
  saveTestProgress(progress: Partial<TestProgress>): Promise<TestProgress>;
  saveTestResult(result: Omit<TestResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestResult>;
  getTestResult(userId: string, testId: string): Promise<TestResult | null>;
  calculateScore(questions: TestQuestion[], answers: Record<string, number | number[]>): Promise<number>;
  generateResultDetails(testId: string, score: number): Promise<TestResultDetails>;
  getTestType(testId: string): Promise<TestType | null>;
}

/**
 * 测试服务
 * 处理测试相关的操作，如获取测试类型、问题、保存进度和结果等
 */
export class TestService implements ITestService {
  private static instance: TestService;
  private dataService: DatabaseService;
  private networkService: NetworkService;
  private initialized: boolean = false;
  private databaseClient: IDatabaseClient;

  /**
   * 构造函数
   */
  private constructor() {
    this.dataService = DatabaseService.getInstance();
    this.networkService = NetworkService.getInstance();
  }

  /**
   * 获取 TestService 的单例
   * @returns TestService 实例
   */
  public static getInstance(): TestService {
    if (!TestService.instance) {
      TestService.instance = new TestService();
    }
    return TestService.instance;
  }

  /**
   * 初始化测试服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 确保数据服务已初始化
      await this.dataService.connect();
      
      // 获取数据库客户端
      this.databaseClient = await this.dataService.getClient();
      
      // 确保网络服务已初始化
      await this.networkService.initialize();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize TestService:', error);
      throw new Error('Failed to initialize TestService');
    }
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 获取所有测试类型
   * @returns 测试类型列表
   */
  public async getTestTypes(): Promise<TestType[]> {
    await this.ensureInitialized();
    return await this.dataService.getTestTypes();
  }

  /**
   * 获取指定测试的问题
   * @param testId 测试ID
   * @returns 问题列表
   */
  public async getTestQuestions(testId: string): Promise<TestQuestion[]> {
    await this.ensureInitialized();
    
    try {
      // 由于IDataService没有直接提供getTestQuestions方法，我们需要使用数据库客户端
      const result = await this.databaseClient.query<TestQuestion>('test_questions', {
        where: { testId }
      });
      return result.data;
    } catch (error) {
      console.error('Error getting test questions:', error);
      return [];
    }
  }

  /**
   * 获取测试进度
   * @param userId 用户ID
   * @param testId 测试ID
   * @returns 测试进度
   */
  public async getTestProgress(userId: string, testId: string): Promise<TestProgress | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.databaseClient.query<TestProgress>('test_progress', {
        where: { userId, testId }
      });
      return result.data[0] || null;
    } catch (error) {
      console.error('Error getting test progress:', error);
      return null;
    }
  }

  /**
   * 保存测试进度
   * @param progress 测试进度数据
   * @returns 保存后的测试进度
   */
  public async saveTestProgress(progress: Partial<TestProgress>): Promise<TestProgress> {
    await this.ensureInitialized();
    
    try {
      if (progress.id) {
        const updated = await this.databaseClient.update<TestProgress>('test_progress', progress.id, progress);
        return updated;
      } else {
        const now = new Date();
        const newProgress = {
          ...progress,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          startedAt: now.toISOString(),
          lastUpdatedAt: now.toISOString(),
          currentQuestionIndex: 0,
          answers: {}
        } as TestProgress;
        return await this.databaseClient.create<TestProgress>('test_progress', newProgress);
      }
    } catch (error) {
      console.error('Error saving test progress:', error);
      throw new Error('Failed to save test progress');
    }
  }

  /**
   * 保存测试结果
   * @param result 测试结果数据
   * @returns 保存后的测试结果
   */
  public async saveTestResult(result: Omit<TestResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestResult> {
    await this.ensureInitialized();
    
    try {
      const now = new Date();
      const newResult = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      } as TestResult;
      return await this.dataService.saveTestResult(newResult);
    } catch (error) {
      console.error('Error saving test result:', error);
      throw new Error('Failed to save test result');
    }
  }

  /**
   * 获取测试结果
   * @param userId 用户ID
   * @param testId 测试ID
   * @returns 测试结果
   */
  public async getTestResult(userId: string, testId: string): Promise<TestResult | null> {
    await this.ensureInitialized();
    return await this.dataService.getTestResult(userId, testId);
  }

  /**
   * 获取测试类型
   * @param testId 测试ID
   * @returns 测试类型
   */
  public async getTestType(testId: string): Promise<TestType | null> {
    await this.ensureInitialized();
    return await this.dataService.getTestType(testId);
  }

  /**
   * 计算测试分数
   * @param questions 测试问题列表
   * @param answers 用户答案
   * @returns 计算得分
   */
  public async calculateScore(questions: TestQuestion[], answers: Record<string, number | number[]>): Promise<number> {
    // 实现计算分数的逻辑
    return 0;
  }

  /**
   * 生成测试结果详情
   * @param testId 测试ID
   * @param score 得分
   * @returns 测试结果详情
   */
  public async generateResultDetails(testId: string, score: number): Promise<TestResultDetails> {
    // 实现生成结果详情的逻辑
    return {} as TestResultDetails;
  }

  /**
   * 获取用户的测试结果
   */
  async getUserTestResults(userId: string): Promise<TestResult[]> {
    const results = await this.dataService.findAll<TestResult>('test_results', {
      where: { userId }
    });
    return results;
  }

  /**
   * 直接保存MBTI测试结果
   */
  async saveMBTIResult(userId: string, mbtiType: MBTIType, scores?: MBTIDimension): Promise<TestResult> {
    // 获取MBTI测试类型
    const testTypes = await this.getTestTypes();
    const mbtiTestType = testTypes.find(t => t.type === 'mbti');
    
    if (!mbtiTestType) {
      throw new Error('MBTI test type not found');
    }

    // 如果没有提供详细分数，生成默认分数
    const defaultScores: MBTIDimension = scores || {
      E: mbtiType.includes('E') ? 75 : 25,
      I: mbtiType.includes('I') ? 75 : 25,
      S: mbtiType.includes('S') ? 75 : 25,
      N: mbtiType.includes('N') ? 75 : 25,
      T: mbtiType.includes('T') ? 75 : 25,
      F: mbtiType.includes('F') ? 75 : 25,
      J: mbtiType.includes('J') ? 75 : 25,
      P: mbtiType.includes('P') ? 75 : 25,
    };

    // 创建测试结果
    const result: Omit<TestResult, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      testId: mbtiTestType.id,
      testType: 'mbti',
      score: 100, // MBTI没有分数概念，设为100表示完成
      details: {
        mbti: {
          type: mbtiType,
          scores: defaultScores
        }
      },
      completedAt: new Date().toISOString(),
      suggestions: await this.generateMBTISuggestions(mbtiType)
    };

    // 保存结果
    const savedResult = await this.dataService.create<TestResult>('test_results', result);

    // 更新用户的测试信息
    await this.updateUserTestInfo(userId, savedResult);

    return savedResult;
  }

  /**
   * 更新用户的测试信息
   */
  private async updateUserTestInfo(userId: string, result: TestResult): Promise<void> {
    const user = await this.dataService.get<User>('users', userId);
    if (!user) return;

    const testResults = { ...user.matching.testResults };
    testResults[result.testType] = {
      score: result.score,
      details: result.details[result.testType],
      lastUpdated: new Date().toISOString()
    };

    const completedTests = [...new Set([...user.matching.completedTests, result.testId])];

    await this.dataService.update<User>('users', userId, {
      matching: {
        ...user.matching,
        completedTests,
        testResults
      }
    });
  }

  /**
   * 生成MBTI类型的建议
   */
  private async generateMBTISuggestions(mbtiType: MBTIType): Promise<string[]> {
    // 这里可以根据MBTI类型生成个性化建议
    // 后续可以从数据库或配置文件中读取
    const suggestions = [
      `作为${mbtiType}类型，你在...方面表现出色`,
      `建议你多关注...领域的发展机会`,
      `在人际交往中，你可以...`,
    ];
    return suggestions;
  }

  /**
   * 获取测试匹配规则
   */
  async getMatchRules(testType: TestType['type']): Promise<TestMatchRule[]> {
    const rules = await this.dataService.findAll<TestMatchRule>('test_match_rules', {
      where: { testType }
    });
    return rules;
  }

  /**
   * 计算两个用户的匹配度
   */
  async calculateMatchScore(user1Id: string, user2Id: string): Promise<{
    totalScore: number;
    details: Record<TestType['type'], number>;
  }> {
    const [user1, user2] = await Promise.all([
      this.dataService.get<User>('users', user1Id),
      this.dataService.get<User>('users', user2Id)
    ]);

    if (!user1 || !user2) {
      throw new Error('User not found');
    }

    const matchScores: Record<TestType['type'], number> = {
      mbti: 0,
      bazi: 0,
      wuxing: 0,
      tcm: 0,
      soulmate: 0
    };

    // 计算每种测试类型的匹配分数
    for (const testType of Object.keys(matchScores) as TestType['type'][]) {
      const result1 = user1.matching.testResults[testType];
      const result2 = user2.matching.testResults[testType];
      
      if (result1 && result2) {
        matchScores[testType] = await this.calculateTypeMatchScore(
          testType,
          result1.details,
          result2.details
        );
      }
    }

    // 计算总分（考虑权重）
    let totalScore = 0;
    let totalWeight = 0;

    for (const testType of Object.keys(matchScores) as TestType['type'][]) {
      const weight1 = user1.matching.testWeights[testType] || 0;
      const weight2 = user2.matching.testWeights[testType] || 0;
      const avgWeight = (weight1 + weight2) / 2;
      
      if (matchScores[testType] > 0) {
        totalScore += matchScores[testType] * avgWeight;
        totalWeight += avgWeight;
      }
    }

    return {
      totalScore: totalWeight > 0 ? (totalScore / totalWeight) : 0,
      details: matchScores
    };
  }

  /**
   * 计算特定测试类型的匹配分数
   */
  private async calculateTypeMatchScore(
    testType: TestType['type'],
    details1: any,
    details2: any
  ): Promise<number> {
    switch (testType) {
      case 'mbti':
        return this.calculateMBTIMatchScore(details1.type, details2.type);
      case 'bazi':
        return this.calculateBaziMatchScore(details1, details2);
      case 'wuxing':
        return this.calculateWuxingMatchScore(details1, details2);
      case 'tcm':
        return this.calculateTCMMatchScore(details1, details2);
      case 'soulmate':
        return this.calculateSoulmateMatchScore(details1, details2);
      default:
        return 0;
    }
  }

  /**
   * 计算MBTI匹配分数
   */
  private async calculateMBTIMatchScore(type1: MBTIType, type2: MBTIType): Promise<number> {
    const rules = await this.getMatchRules('mbti');
    const rule = rules.find(r => r.rules.mbti?.type === type1);
    
    if (!rule?.rules.mbti) return 50; // 默认中等匹配度

    if (rule.rules.mbti.bestMatches.includes(type2)) return 100;
    if (rule.rules.mbti.goodMatches.includes(type2)) return 80;
    if (rule.rules.mbti.neutralMatches.includes(type2)) return 60;
    if (rule.rules.mbti.challengingMatches.includes(type2)) return 40;
    
    return 50; // 默认中等匹配度
  }

  /**
   * 计算八字匹配分数
   */
  private calculateBaziMatchScore(details1: any, details2: any): number {
    // TODO: 实现八字匹配算法
    return 50;
  }

  /**
   * 计算五行匹配分数
   */
  private calculateWuxingMatchScore(details1: any, details2: any): number {
    // TODO: 实现五行匹配算法
    return 50;
  }

  /**
   * 计算中医体质匹配分数
   */
  private calculateTCMMatchScore(details1: any, details2: any): number {
    // TODO: 实现中医体质匹配算法
    return 50;
  }

  /**
   * 计算灵魂契合度匹配分数
   */
  private calculateSoulmateMatchScore(details1: any, details2: any): number {
    // TODO: 实现灵魂契合度匹配算法
    return 50;
  }
} 