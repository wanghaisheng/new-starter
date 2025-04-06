import { schemaRegistry, TableSchema } from '../registry';

// 测试类型表结构
const testTypeSchema: TableSchema = {
  name: 'test_types',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'name',
      type: 'string',
      notNull: true
    },
    {
      name: 'description',
      type: 'text',
      notNull: true
    },
    {
      name: 'category',
      type: 'string',
      notNull: true
    },
    {
      name: 'totalQuestions',
      type: 'integer',
      notNull: true
    },
    {
      name: 'timeLimit',
      type: 'integer'
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_types_category',
      columns: ['category']
    }
  ]
};

// 测试问题表结构
const testQuestionSchema: TableSchema = {
  name: 'test_questions',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'testTypeId',
      type: 'string',
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'order',
      type: 'integer',
      notNull: true
    },
    {
      name: 'question',
      type: 'text',
      notNull: true
    },
    {
      name: 'options',
      type: 'json',
      notNull: true
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_questions_test_type',
      columns: ['testTypeId']
    },
    {
      name: 'idx_test_questions_order',
      columns: ['testTypeId', 'order']
    }
  ]
};

// 测试结果表结构
const testResultSchema: TableSchema = {
  name: 'test_results',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'userId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'testTypeId',
      type: 'string',
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'answers',
      type: 'json',
      notNull: true
    },
    {
      name: 'score',
      type: 'integer',
      notNull: true
    },
    {
      name: 'details',
      type: 'json',
      notNull: true
    },
    {
      name: 'completedAt',
      type: 'date',
      notNull: true
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_results_user',
      columns: ['userId']
    },
    {
      name: 'idx_test_results_test_type',
      columns: ['testTypeId']
    },
    {
      name: 'idx_test_results_completed',
      columns: ['completedAt']
    }
  ]
};

// 测试进度表结构
const testProgressSchema: TableSchema = {
  name: 'test_progress',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'userId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'testTypeId',
      type: 'string',
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'currentQuestionIndex',
      type: 'integer',
      notNull: true,
      defaultValue: 0
    },
    {
      name: 'answers',
      type: 'json',
      notNull: true,
      defaultValue: '{}'
    },
    {
      name: 'startedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'lastUpdatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_progress_user',
      columns: ['userId']
    },
    {
      name: 'idx_test_progress_test_type',
      columns: ['testTypeId']
    },
    {
      name: 'idx_test_progress_user_test',
      columns: ['userId', 'testTypeId'],
      unique: true
    }
  ]
};

// 注册所有表结构
schemaRegistry.registerSchema(testTypeSchema);
schemaRegistry.registerSchema(testQuestionSchema);
schemaRegistry.registerSchema(testResultSchema);
schemaRegistry.registerSchema(testProgressSchema);

export {
  testTypeSchema,
  testQuestionSchema,
  testResultSchema,
  testProgressSchema
}; 