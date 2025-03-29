// 导出接口
export * from './types';
export * from './interfaces';
export * from './schema';
export * from './service';
export * from './factory';
export * from './config';

// 导出模型
export * from './models/user';
export * from './models/match';
export * from './models/message';

// 导出仓储
export { BaseRepository } from './repositories/base-repository';
export { UserRepository } from './repositories/user-repository';
export { MatchRepository } from './repositories/match-repository';
export { MessageRepository } from './repositories/message-repository';

// 导出表结构
export { schemaRegistry } from './schema/index';
export { drizzleSchema, migrationSQL } from './schema/drizzle-schema';

// 创建并导出默认数据库服务实例
import { DatabaseService } from './service';
export const db = DatabaseService.getInstance();