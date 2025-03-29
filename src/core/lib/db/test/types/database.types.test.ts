import { describe, it, expect } from 'vitest';
import type {
  DatabaseEngine,
  SyncStrategy,
  SyncStatus,
  DatabaseConfig,
  DatabaseVersion,
  DatabaseError,
  QueryOperator,
  QueryOptions,
  SyncState,
  DatabaseStats,
  DatabaseResult,
  DatabaseTransaction,
  DatabaseEvent,
  BatchOperation,
  QueryResult,
  DatabaseMetrics,
  StorageStats
} from '../../types/database.types';
import type { BaseEntity } from '../../types/base-entity';

describe('Database Types', () => {
  // 测试 DatabaseEngine 类型
  it('should have valid database engine values', () => {
    const engines: DatabaseEngine[] = [
      'mock',
      'indexeddb',
      'sqlite',
      'cloudflare-d1',
      'firebase',
      'supabase',
      'turso',
      'tidb',
      'postgres'
    ];
    engines.forEach(engine => {
      expect(typeof engine).toBe('string');
    });
  });

  // 测试 SyncStrategy 类型
  it('should have valid sync strategy values', () => {
    const strategies: SyncStrategy[] = ['immediate', 'periodic', 'manual'];
    strategies.forEach(strategy => {
      expect(typeof strategy).toBe('string');
    });
  });

  // 测试 DatabaseConfig 接口
  it('should have required database config fields', () => {
    const config: DatabaseConfig = {
      name: 'test_db',
      version: 1,
      engine: 'sqlite',
      offline: {
        maxStorageSize: 1024 * 1024,
        maxEntitiesPerTable: 1000,
        compressionEnabled: true,
        encryptionEnabled: true
      },
      tables: {
        users: {
          columns: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        }
      }
    };
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('engine');
    expect(config).toHaveProperty('offline');
    expect(config).toHaveProperty('tables');
  });

  // 测试 QueryOptions 接口
  it('should have valid query options structure', () => {
    const options: QueryOptions = {
      where: {
        field: 'name',
        operator: '==',
        value: 'test'
      },
      orderBy: {
        field: 'createdAt',
        direction: 'desc'
      },
      limit: 10
    };
    expect(options.where).toBeDefined();
    expect(options.orderBy).toBeDefined();
    expect(options.limit).toBeDefined();
  });

  // 测试 BatchOperation 接口
  it('should have valid batch operation structure', () => {
    const operation: BatchOperation<any> = {
      type: 'add',
      data: { id: '1', name: 'test' }
    };
    expect(operation).toHaveProperty('type');
    expect(operation).toHaveProperty('data');
    expect(['add', 'put', 'delete']).toContain(operation.type);
  });

  // 测试 QueryResult 接口
  it('should have valid query result structure', () => {
    const result: QueryResult<any> = {
      data: [],
      total: 0,
      hasMore: false
    };
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('hasMore');
  });

  // 测试 DatabaseError 接口
  it('should have valid database error structure', () => {
    const error: DatabaseError = {
      name: 'DatabaseError',
      message: 'Test error',
      code: 'TEST_ERROR',
      details: { field: 'test' }
    };
    expect(error).toHaveProperty('code');
    expect(error).toHaveProperty('details');
  });

  // 测试 DatabaseTransaction 接口
  it('should have valid transaction methods', () => {
    const transaction: DatabaseTransaction = {
      commit: async () => {},
      rollback: async () => {},
      isActive: () => true
    };
    expect(transaction).toHaveProperty('commit');
    expect(transaction).toHaveProperty('rollback');
    expect(transaction).toHaveProperty('isActive');
  });

  describe('DatabaseEngine Type', () => {
    it('should accept valid database engines', () => {
      const validEngines: DatabaseEngine[] = [
        'mock',
        'indexeddb',
        'sqlite',
        'cloudflare-d1',
        'firebase',
        'supabase',
        'turso',
        'tidb',
        'postgres'
      ];

      validEngines.forEach(engine => {
        // TypeScript 编译时检查
        const config: DatabaseConfig = {
          name: 'test',
          version: 1,
          engine,
          offline: {
            maxStorageSize: 1000000,
            maxEntitiesPerTable: 1000,
            compressionEnabled: false,
            encryptionEnabled: false
          },
          tables: {}
        };
        expect(config.engine).toBe(engine);
      });
    });

    it('should not accept invalid database engines', () => {
      // @ts-expect-error - 无效的数据库引擎类型
      const invalidEngine: DatabaseEngine = 'invalid-engine';
      expect(typeof invalidEngine).toBe('string');
    });
  });

  describe('DatabaseConfig Interface', () => {
    it('should validate required fields', () => {
      const config: DatabaseConfig = {
        name: 'test-db',
        version: 1,
        engine: 'sqlite',
        offline: {
          maxStorageSize: 1000000,
          maxEntitiesPerTable: 1000,
          compressionEnabled: false,
          encryptionEnabled: false
        },
        tables: {
          users: {
            columns: {
              id: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'number' }
            }
          }
        }
      };

      expect(config.name).toBe('test-db');
      expect(config.version).toBe(1);
      expect(config.engine).toBe('sqlite');
      expect(config.offline.maxStorageSize).toBe(1000000);
    });

    it('should handle optional sync configuration', () => {
      const config: DatabaseConfig = {
        name: 'test-db',
        version: 1,
        engine: 'sqlite',
        sync: {
          enabled: true,
          strategy: 'periodic',
          interval: 5000,
          retryAttempts: 3,
          retryDelay: 1000,
          conflictResolution: 'client-wins'
        },
        offline: {
          maxStorageSize: 1000000,
          maxEntitiesPerTable: 1000,
          compressionEnabled: false,
          encryptionEnabled: false
        },
        tables: {}
      };

      expect(config.sync?.enabled).toBe(true);
      expect(config.sync?.strategy).toBe('periodic');
      expect(config.sync?.interval).toBe(5000);
    });

    it('should validate table configuration', () => {
      const config: DatabaseConfig = {
        name: 'test-db',
        version: 1,
        engine: 'sqlite',
        offline: {
          maxStorageSize: 1000000,
          maxEntitiesPerTable: 1000,
          compressionEnabled: false,
          encryptionEnabled: false
        },
        tables: {
          users: {
            columns: {
              id: { type: 'string' },
              email: { 
                type: 'string',
                constraints: ['unique', 'not null']
              }
            },
            indexes: {
              email_idx: {
                columns: ['email'],
                unique: true
              }
            }
          }
        }
      };

      const userTable = config.tables.users;
      expect(userTable.columns.id.type).toBe('string');
      expect(userTable.columns.email.constraints).toContain('unique');
      expect(userTable.indexes?.email_idx.unique).toBe(true);
    });
  });

  describe('QueryOptions Interface', () => {
    it('should validate query operators', () => {
      const validOperators: QueryOperator[] = ['==', '<', '<=', '>', '>=', '!='];
      
      validOperators.forEach(operator => {
        const queryOptions: QueryOptions = {
          where: {
            field: 'age',
            operator,
            value: 25
          }
        };
        expect(queryOptions.where?.operator).toBe(operator);
      });
    });

    it('should handle complex query options', () => {
      const queryOptions: QueryOptions = {
        where: {
          field: 'age',
          operator: '>=',
          value: 18
        },
        orderBy: {
          field: 'name',
          direction: 'asc'
        },
        limit: 10,
        offset: 0
      };

      expect(queryOptions.where?.field).toBe('age');
      expect(queryOptions.orderBy?.direction).toBe('asc');
      expect(queryOptions.limit).toBe(10);
    });
  });

  describe('DatabaseResult Interface', () => {
    interface TestEntity extends BaseEntity {
      name: string;
    }

    it('should handle successful result', () => {
      const result: DatabaseResult<TestEntity> = {
        success: true,
        data: {
          id: '1',
          name: 'Test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test');
      expect(result.error).toBeUndefined();
    });

    it('should handle error result', () => {
      const error = new Error('Database error');
      const result: DatabaseResult<TestEntity> = {
        success: false,
        error
      };

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe(error);
    });
  });

  describe('BatchOperation Interface', () => {
    interface TestEntity extends BaseEntity {
      name: string;
    }

    it('should handle different operation types', () => {
      const entity: TestEntity = {
        id: '1',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const addOperation: BatchOperation<TestEntity> = {
        type: 'add',
        data: entity
      };

      const putOperation: BatchOperation<TestEntity> = {
        type: 'put',
        data: entity
      };

      const deleteOperation: BatchOperation<TestEntity> = {
        type: 'delete',
        data: entity
      };

      expect(addOperation.type).toBe('add');
      expect(putOperation.type).toBe('put');
      expect(deleteOperation.type).toBe('delete');
    });
  });

  describe('QueryResult Interface', () => {
    interface TestEntity extends BaseEntity {
      name: string;
    }

    it('should handle query results', () => {
      const entities: TestEntity[] = [
        {
          id: '1',
          name: 'Test 1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Test 2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result: QueryResult<TestEntity> = {
        data: entities,
        total: 10,
        hasMore: true
      };

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(10);
      expect(result.hasMore).toBe(true);
    });
  });
}); 