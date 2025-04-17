// 导出接口
export * from './types';
export * from './interfaces';
export * from './schema';

// 导出模型
export { User as UserModel } from './models/user';
export { Match as MatchModel } from './models/match';
export { Message as MessageModel } from './models/message';

// 导出仓储
export { BaseRepository } from './repositories/base-repository';
export { UserRepository } from './repositories/user-repository';
export { MatchRepository } from './repositories/match-repository';
export { MessageRepository } from './repositories/message-repository';

// 导出表结构
export { schemaRegistry } from './schema/index';
export { drizzleSchema, migrationSQL } from './schema/drizzle-schema';

