import { TestTools } from './index';

/**
 * 测试工具使用示例
 */
export class TestToolsExample {
  private testTools: TestTools;

  constructor() {
    this.testTools = TestTools.getInstance();
  }

  /**
   * 运行测试示例
   */
  public async runExample(): Promise<void> {
    // 初始化测试环境
    await this.testTools.initialize();

    try {
      // 获取测试工具实例
      const envManager = this.testTools.getEnvironmentManager();
      const dataGenerator = this.testTools.getDataGenerator();

      // 更新测试环境配置
      envManager.updateConfig({
        database: {
          type: 'sqlite',
          name: 'example_test_db',
          version: 1,
        },
        testData: {
          seed: 12345,
          cleanupBeforeTest: true,
          cleanupAfterTest: true,
        },
      });

      // 生成测试数据
      const testData = {
        // 生成基本类型数据
        string: dataGenerator.generateBasicType('string'),
        number: dataGenerator.generateBasicType('number'),
        boolean: dataGenerator.generateBasicType('boolean'),
        date: dataGenerator.generateBasicType('date'),
        email: dataGenerator.generateBasicType('email'),
        url: dataGenerator.generateBasicType('url'),
        uuid: dataGenerator.generateBasicType('uuid'),

        // 生成复杂对象
        complexObject: dataGenerator.generateComplexObject({
          name: 'string',
          age: 'number',
          isActive: 'boolean',
          createdAt: 'date',
          contact: {
            email: 'email',
            phone: 'string',
          },
        }),

        // 生成边界值数据
        boundaryValues: {
          string: dataGenerator.generateBoundaryValue('string', 'min'),
          number: dataGenerator.generateBoundaryValue('number', 'max'),
        },

        // 生成无效数据
        invalidData: dataGenerator.generateInvalidData('string', 'format'),
      };

      // 使用测试数据
      console.log('Generated test data:', testData);

      // TODO: 使用测试数据执行实际的测试操作
      // 例如：创建数据库记录、执行查询等

    } finally {
      // 清理测试环境
      await this.testTools.cleanup();
    }
  }
}

// 运行示例
if (require.main === module) {
  const example = new TestToolsExample();
  example.runExample().catch(console.error);
} 