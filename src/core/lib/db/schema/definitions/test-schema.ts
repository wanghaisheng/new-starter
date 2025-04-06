import { schemaRegistry, TableSchema } from '@/core/lib/db/schema/index';
import { ColumnType } from '@/core/lib/db/schema/types';

// 测试类型表结构
const testTypeSchema: TableSchema = {
  name: 'test_types',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'type',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'title',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'description',
      type: ColumnType.TEXT,
      notNull: true
    },
    {
      name: 'questionCount',
      type: ColumnType.NUMBER,
      notNull: true
    },
    {
      name: 'estimatedTime',
      type: ColumnType.NUMBER,
      notNull: true
    },
    {
      name: 'matchingWeight',
      type: ColumnType.NUMBER,
      notNull: true
    },
    {
      name: 'isActive',
      type: ColumnType.BOOLEAN,
      notNull: true,
      defValue: true
    },
    {
      name: 'allowDirectInput',
      type: ColumnType.BOOLEAN,
      defValue: false
    },
    {
      name: 'order',
      type: ColumnType.NUMBER,
      notNull: true
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_types_type',
      columns: ['type'],
      unique: true
    },
    {
      name: 'idx_test_types_active',
      columns: ['isActive']
    },
    {
      name: 'idx_test_types_order',
      columns: ['order']
    }
  ]
};

// 测试问题表结构
const testQuestionSchema: TableSchema = {
  name: 'test_questions',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'type',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'question',
      type: ColumnType.TEXT,
      notNull: true
    },
    {
      name: 'options',
      type: ColumnType.JSON
    },
    {
      name: 'minScale',
      type: ColumnType.NUMBER
    },
    {
      name: 'maxScale',
      type: ColumnType.NUMBER
    },
    {
      name: 'weight',
      type: ColumnType.NUMBER
    },
    {
      name: 'order',
      type: ColumnType.NUMBER
    },
    {
      name: 'testTypeId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_questions_test_type',
      columns: ['testTypeId']
    },
    {
      name: 'idx_test_questions_order',
      columns: ['order']
    }
  ]
};

// 测试结果表结构
const testResultSchema: TableSchema = {
  name: 'test_results',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'userId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'testId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'testType',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'score',
      type: ColumnType.NUMBER,
      notNull: true
    },
    {
      name: 'details',
      type: ColumnType.JSON,
      notNull: true
    },
    {
      name: 'answers',
      type: ColumnType.JSON
    },
    {
      name: 'completedAt',
      type: ColumnType.DATE,
      notNull: true
    },
    {
      name: 'suggestions',
      type: ColumnType.JSON
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_results_user',
      columns: ['userId']
    },
    {
      name: 'idx_test_results_test',
      columns: ['testId']
    },
    {
      name: 'idx_test_results_type',
      columns: ['testType']
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
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'userId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'testId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'currentQuestionIndex',
      type: ColumnType.NUMBER,
      notNull: true,
      defValue: 0
    },
    {
      name: 'answers',
      type: ColumnType.JSON,
      notNull: true,
      defValue: '{}'
    },
    {
      name: 'startedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'lastUpdatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_progress_user_test',
      columns: ['userId', 'testId'],
      unique: true
    }
  ]
};

// 测试匹配规则表结构
const testMatchRuleSchema: TableSchema = {
  name: 'test_match_rules',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'testType',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'rules',
      type: ColumnType.JSON,
      notNull: true
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_test_match_rules_type',
      columns: ['testType'],
      unique: true
    }
  ]
};

// 评分规则表结构
const scoringRuleSchema: TableSchema = {
  name: 'scoring_rules',
  columns: [
    {
      name: 'id',
      type: ColumnType.STRING,
      primaryKey: true,
      notNull: true
    },
    {
      name: 'testId',
      type: ColumnType.STRING,
      notNull: true,
      references: {
        table: 'test_types',
        column: 'id'
      }
    },
    {
      name: 'trait',
      type: ColumnType.STRING,
      notNull: true
    },
    {
      name: 'questions',
      type: ColumnType.JSON,
      notNull: true
    },
    {
      name: 'weight',
      type: ColumnType.NUMBER,
      notNull: true
    },
    {
      name: 'createdAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: ColumnType.DATE,
      notNull: true,
      defValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_scoring_rules_test',
      columns: ['testId']
    },
    {
      name: 'idx_scoring_rules_trait',
      columns: ['trait']
    }
  ]
};

// 注册所有表结构
schemaRegistry.register(testTypeSchema);
schemaRegistry.register(testQuestionSchema);
schemaRegistry.register(testResultSchema);
schemaRegistry.register(testProgressSchema);
schemaRegistry.register(testMatchRuleSchema);
schemaRegistry.register(scoringRuleSchema);

export {
  testTypeSchema,
  testQuestionSchema,
  testResultSchema,
  testProgressSchema,
  testMatchRuleSchema,
  scoringRuleSchema
}; 