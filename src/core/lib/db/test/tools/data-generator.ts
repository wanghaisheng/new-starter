import { faker } from '@faker-js/faker';
import type { BaseEntity } from '@/core/types';

/**
 * 测试数据生成器
 * 用于生成测试所需的各类数据
 */
export class TestDataGenerator {
  private static instance: TestDataGenerator;
  private faker: typeof faker;

  private constructor() {
    this.faker = faker;
  }

  public static getInstance(): TestDataGenerator {
    if (!TestDataGenerator.instance) {
      TestDataGenerator.instance = new TestDataGenerator();
    }
    return TestDataGenerator.instance;
  }

  /**
   * 生成基础类型数据
   */
  public generateBasicType<T extends string>(type: T): any {
    switch (type) {
      case 'string':
        return this.faker.string.sample();
      case 'number':
        return this.faker.number.int();
      case 'boolean':
        return this.faker.datatype.boolean();
      case 'date':
        return this.faker.date.recent();
      case 'email':
        return this.faker.internet.email();
      case 'url':
        return this.faker.internet.url();
      case 'uuid':
        return this.faker.string.uuid();
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  /**
   * 生成复杂对象数据
   */
  public generateComplexObject<T extends Record<string, any>>(
    schema: T,
    options: {
      nullable?: boolean;
      array?: boolean;
      min?: number;
      max?: number;
    } = {}
  ): T | T[] {
    const { nullable = false, array = false, min = 1, max = 5 } = options;

    if (nullable && this.faker.datatype.boolean()) {
      return null as any;
    }

    if (array) {
      const length = this.faker.number.int({ min, max });
      return Array.from({ length }, () => this.generateObject(schema));
    }

    return this.generateObject(schema);
  }

  /**
   * 生成实体数据
   */
  public generateEntity<T extends BaseEntity>(
    entityClass: new () => T,
    options: {
      count?: number;
      withRelations?: boolean;
    } = {}
  ): T | T[] {
    const { count = 1, withRelations = false } = options;
    const entities = Array.from({ length: count }, () => {
      const entity = new entityClass();
      // TODO: 实现实体属性生成
      return entity;
    });

    return count === 1 ? entities[0] : entities;
  }

  /**
   * 生成边界条件数据
   */
  public generateBoundaryValue<T extends string>(
    type: T,
    boundary: 'min' | 'max' | 'null' | 'empty'
  ): any {
    switch (type) {
      case 'string':
        switch (boundary) {
          case 'min':
            return '';
          case 'max':
            return this.faker.string.sample({ length: 1000 });
          case 'null':
            return null;
          case 'empty':
            return '';
        }
      case 'number':
        switch (boundary) {
          case 'min':
            return Number.MIN_SAFE_INTEGER;
          case 'max':
            return Number.MAX_SAFE_INTEGER;
          case 'null':
            return null;
          case 'empty':
            return 0;
        }
      default:
        throw new Error(`Unsupported type for boundary value: ${type}`);
    }
  }

  /**
   * 生成异常数据
   */
  public generateInvalidData<T extends string>(
    type: T,
    errorType: 'format' | 'type' | 'missing'
  ): any {
    switch (type) {
      case 'string':
        switch (errorType) {
          case 'format':
            return this.faker.string.sample({ length: 1000 }); // 超出长度限制
          case 'type':
            return this.faker.number.int();
          case 'missing':
            return undefined;
        }
      case 'number':
        switch (errorType) {
          case 'format':
            return 'not-a-number';
          case 'type':
            return this.faker.string.sample();
          case 'missing':
            return undefined;
        }
      default:
        throw new Error(`Unsupported type for invalid data: ${type}`);
    }
  }

  private generateObject<T extends Record<string, any>>(schema: T): T {
    const result = {} as T;
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'string') {
        result[key as keyof T] = this.generateBasicType(value) as T[keyof T];
      } else if (typeof value === 'object') {
        result[key as keyof T] = this.generateComplexObject(value) as T[keyof T];
      }
    }
    return result;
  }
} 