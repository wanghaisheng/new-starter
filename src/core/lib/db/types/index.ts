// 类型聚合导出，所有业务类型统一从 *.types.ts 引入
export * from './location.types';
export * from './photo.types';
export * from './match.types';
export * from './message.types';
export * from './interaction.types';
export * from './quiz.types';
export * from './feedback.types';
export * from './gift.types';
export * from './notification.types';
export * from './onboard.types';
export * from './payment.types';
export * from './settings.types';
export * from './skin.types';
export * from './user.types';
export * from './translation.types';

// 导出类型转换工具
export * from './converters';

// 命名空间导出，避免命名冲突
export * as DatabaseTypes from './database';
export * as SimulatorTypes from './simulator';

// 明确导出重命名后的 BatchOperation 类型
export type { BatchOperation as DatabaseBatchOperation } from './database';

// 新增导出
// export * from './database-error';

/**
 * 类型推断工具：获取表结构对应的类型定义
 * 仅用于类型推断，不可用于运行时代码
 * @example type UserSchema = SchemaType<'user'>;
 */
export type SchemaType<T extends string> =
  T extends 'user' ? import('./user.types').User
  : T extends 'match' ? import('./match.types').Match
  : T extends 'photo' ? import('./photo.types').Photo
  : unknown;

// 如需运行时代码，请在单独文件实现，不建议在类型聚合文件中混用