import { z } from 'zod';

/**
 * 测试环境配置
 */
export interface TestEnvironmentConfig {
  // 数据库配置
  database: {
    type: 'sqlite' | 'indexeddb' | 'firebase';
    name: string;
    version?: number;
    encryptionKey?: string;
  };
  
  // 测试数据配置
  testData: {
    seed?: number;
    cleanupBeforeTest: boolean;
    cleanupAfterTest: boolean;
  };
  
  // 性能监控配置
  monitoring: {
    enabled: boolean;
    memoryThreshold: number; // MB
    cpuThreshold: number; // %
    networkThreshold: number; // MB/s
  };
  
  // 测试工具配置
  tools: {
    coverage: {
      enabled: boolean;
      reporters: string[];
      thresholds: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
      };
    };
    performance: {
      enabled: boolean;
      reporters: string[];
      thresholds: {
        batchOperation: number; // ms
        queryOperation: number; // ms
        concurrentOperation: number; // ms
      };
    };
  };
}

/**
 * 测试环境配置验证器
 */
const TestEnvironmentConfigSchema = z.object({
  database: z.object({
    type: z.enum(['sqlite', 'indexeddb', 'firebase']),
    name: z.string(),
    version: z.number().optional(),
    encryptionKey: z.string().optional(),
  }),
  
  testData: z.object({
    seed: z.number().optional(),
    cleanupBeforeTest: z.boolean(),
    cleanupAfterTest: z.boolean(),
  }),
  
  monitoring: z.object({
    enabled: z.boolean(),
    memoryThreshold: z.number(),
    cpuThreshold: z.number(),
    networkThreshold: z.number(),
  }),
  
  tools: z.object({
    coverage: z.object({
      enabled: z.boolean(),
      reporters: z.array(z.string()),
      thresholds: z.object({
        statements: z.number(),
        branches: z.number(),
        functions: z.number(),
        lines: z.number(),
      }),
    }),
    performance: z.object({
      enabled: z.boolean(),
      reporters: z.array(z.string()),
      thresholds: z.object({
        batchOperation: z.number(),
        queryOperation: z.number(),
        concurrentOperation: z.number(),
      }),
    }),
  }),
});

/**
 * 测试环境管理器
 */
export class TestEnvironmentManager {
  private static instance: TestEnvironmentManager;
  private config: TestEnvironmentConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): TestEnvironmentManager {
    if (!TestEnvironmentManager.instance) {
      TestEnvironmentManager.instance = new TestEnvironmentManager();
    }
    return TestEnvironmentManager.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): TestEnvironmentConfig {
    return {
      database: {
        type: 'sqlite',
        name: 'test_db',
        version: 1,
      },
      testData: {
        cleanupBeforeTest: true,
        cleanupAfterTest: true,
      },
      monitoring: {
        enabled: true,
        memoryThreshold: 100,
        cpuThreshold: 80,
        networkThreshold: 10,
      },
      tools: {
        coverage: {
          enabled: true,
          reporters: ['text', 'lcov'],
          thresholds: {
            statements: 90,
            branches: 85,
            functions: 95,
            lines: 90,
          },
        },
        performance: {
          enabled: true,
          reporters: ['json', 'html'],
          thresholds: {
            batchOperation: 1000,
            queryOperation: 100,
            concurrentOperation: 500,
          },
        },
      },
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<TestEnvironmentConfig>): void {
    const newConfig = { ...this.config, ...config };
    TestEnvironmentConfigSchema.parse(newConfig);
    this.config = newConfig;
  }

  /**
   * 获取当前配置
   */
  public getConfig(): TestEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * 重置配置
   */
  public resetConfig(): void {
    this.config = this.getDefaultConfig();
  }

  /**
   * 验证配置
   */
  public validateConfig(config: Partial<TestEnvironmentConfig>): boolean {
    try {
      TestEnvironmentConfigSchema.parse({ ...this.config, ...config });
      return true;
    } catch (error) {
      return false;
    }
  }
} 