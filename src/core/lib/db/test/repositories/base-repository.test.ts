import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseRepository } from '../../repositories/base-repository';
import { MockDatabaseClient, MockFunction } from '../types/mock.types';
import { BaseEntity, QueryResult, BatchOperation, QueryOptions } from '../../types';

// 测试用的实体类型
interface TestEntity extends BaseEntity {
  name: string;
  age: number;
}

// 测试用的仓储类
class TestRepository extends BaseRepository<TestEntity> {
  constructor(client: MockDatabaseClient<TestEntity>) {
    super(client, 'test_table');
  }
}

describe('BaseRepository', () => {
  let mockClient: MockDatabaseClient<TestEntity>;
  let repository: TestRepository;

  beforeEach(() => {
    // 创建模拟的数据库客户端
    mockClient = {
      initialize: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({} as TestEntity),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
      count: vi.fn().mockResolvedValue(0),
      beginTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      batch: vi.fn().mockResolvedValue(undefined),
      executeRawQuery: vi.fn().mockResolvedValue([])
    };

    repository = new TestRepository(mockClient);
  });

  // 测试 findById 方法
  it('should call client.findById with correct parameters', async () => {
    const mockEntity: TestEntity = {
      id: '1',
      name: 'Test',
      age: 25,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockClient.findById.mockResolvedValue(mockEntity);

    const result = await repository.findById('1');

    expect(mockClient.findById).toHaveBeenCalledWith('test_table', '1');
    expect(result).toEqual(mockEntity);
  });

  // 测试 findAll 方法
  it('should call client.findAll with correct parameters', async () => {
    const mockEntities: TestEntity[] = [
      {
        id: '1',
        name: 'Test 1',
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Test 2',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    mockClient.findAll.mockResolvedValue(mockEntities);

    const filter = { age: { $gt: 20 } };
    const result = await repository.findAll(filter);

    expect(mockClient.findAll).toHaveBeenCalledWith('test_table', filter);
    expect(result).toEqual(mockEntities);
  });

  // 测试 create 方法
  it('should call client.create with correct parameters', async () => {
    const createData = {
      name: 'Test',
      age: 25
    };
    const mockEntity: TestEntity = {
      id: '1',
      ...createData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockClient.create.mockResolvedValue(mockEntity);

    const result = await repository.create(createData);

    expect(mockClient.create).toHaveBeenCalledWith('test_table', expect.objectContaining(createData));
    expect(result).toEqual(mockEntity);
  });

  // 测试 update 方法
  it('should call client.update with correct parameters', async () => {
    const updateData = {
      name: 'Updated',
      age: 26
    };
    mockClient.update.mockResolvedValue(undefined);

    await repository.update('1', updateData);

    expect(mockClient.update).toHaveBeenCalledWith('test_table', '1', updateData);
  });

  // 测试 delete 方法
  it('should call client.delete with correct parameters', async () => {
    mockClient.delete.mockResolvedValue(undefined);

    await repository.delete('1');

    expect(mockClient.delete).toHaveBeenCalledWith('test_table', '1');
  });

  // 测试 query 方法
  it('should call client.query with correct parameters', async () => {
    const queryOptions: QueryOptions = {
      where: { field: 'age', operator: '>', value: 20 },
      orderBy: { field: 'name', direction: 'asc' },
      limit: 10
    };
    const mockResult: QueryResult<TestEntity> = {
      data: [],
      total: 0,
      hasMore: false
    };
    mockClient.query.mockResolvedValue(mockResult);

    const result = await repository.query(queryOptions);

    expect(mockClient.query).toHaveBeenCalledWith('test_table', queryOptions);
    expect(result).toEqual(mockResult);
  });

  // 测试 batch 方法
  it('should call client.batch with correct parameters', async () => {
    const operations: BatchOperation<TestEntity>[] = [
      {
        type: 'add',
        data: {
          id: '1',
          name: 'Test',
          age: 25,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];
    mockClient.batch.mockResolvedValue(undefined);

    await repository.batch(operations);

    expect(mockClient.batch).toHaveBeenCalledWith('test_table', operations);
  });

  // 测试 transaction 方法
  it('should handle transaction correctly', async () => {
    const mockResult = { success: true };
    mockClient.beginTransaction.mockResolvedValue(undefined);
    mockClient.commitTransaction.mockResolvedValue(undefined);
    mockClient.rollbackTransaction.mockResolvedValue(undefined);

    const result = await repository.transaction(async (tx) => {
      return mockResult;
    });

    expect(mockClient.beginTransaction).toHaveBeenCalled();
    expect(mockClient.commitTransaction).toHaveBeenCalled();
    expect(mockClient.rollbackTransaction).not.toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  // 测试事务回滚
  it('should rollback transaction on error', async () => {
    const error = new Error('Test error');
    mockClient.beginTransaction.mockResolvedValue(undefined);
    mockClient.rollbackTransaction.mockResolvedValue(undefined);

    await expect(repository.transaction(async (tx) => {
      throw error;
    })).rejects.toThrow(error);

    expect(mockClient.beginTransaction).toHaveBeenCalled();
    expect(mockClient.rollbackTransaction).toHaveBeenCalled();
    expect(mockClient.commitTransaction).not.toHaveBeenCalled();
  });

  // 测试 executeRawQuery 方法
  it('should call client.executeRawQuery with correct parameters', async () => {
    const query = 'SELECT * FROM test_table WHERE age > ?';
    const params = [20];
    const mockResult = [{ id: '1', name: 'Test', age: 25 }];
    mockClient.executeRawQuery.mockResolvedValue(mockResult);

    const result = await repository.executeRawQuery(query, params);

    expect(mockClient.executeRawQuery).toHaveBeenCalledWith(query, params);
    expect(result).toEqual(mockResult);
  });
}); 