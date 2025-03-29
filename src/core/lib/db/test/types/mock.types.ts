import { vi, Mock } from 'vitest';
import { IBaseDatabaseClient } from '@db/interfaces';
import { BaseEntity } from '@db/types/base-entity';
import { QueryOptions, QueryResult, BatchOperation } from '@db/types/database.types';

// 定义一个更精确的MockFunction类型，包含所有必要的mock方法
export type MockFunction<T = any> = Mock<(...args: any[]) => Promise<T>>;

export interface MockDatabaseClient<T extends BaseEntity = BaseEntity> extends IBaseDatabaseClient<T> {
  // 模拟方法
  initialize: MockFunction<void>;
  close: MockFunction<void>;
  clear: MockFunction<void>;
  findById: MockFunction<T | null>;
  findAll: MockFunction<T[]>;
  create: MockFunction<T>;
  update: MockFunction<void>;
  delete: MockFunction<void>;
  query: MockFunction<QueryResult<T>>;
  count: MockFunction<number>;
  beginTransaction: MockFunction<void>;
  commitTransaction: MockFunction<void>;
  rollbackTransaction: MockFunction<void>;
  batch: MockFunction<void>;
  executeRawQuery: MockFunction<any[]>;
} 