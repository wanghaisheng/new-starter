import type { DatabaseConfig, DatabaseEngine, SyncConfig } from '../database.types';

describe('Database 类型定义', () => {
  it('DatabaseConfig 应包含 engine/sync/quizData 字段', () => {
    const config: DatabaseConfig = {
      name: 'testdb',
      version: 1,
      engine: 'sqlite',
      schemas: [],
      tables: {},
      env: { environment: 'development', enableOffline: false, enableHybrid: false },
      storage: {
        online: { type: 'sqlite', connection: {} },
        offline: { type: 'sqlite', connection: {} },
      },
      sync: { enabled: true, strategy: 'auto' },
      quizData: { loadOnStartup: false, source: 'example' },
    };
    expect(config.engine).toBe('sqlite');
    expect(config.quizData?.source).toBe('example');
  });
});
