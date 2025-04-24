/**
 * 混合数据库客户端模块
 * 
 * 此模块导出了 HybridDatabaseClient 类，提供在线/离线混合存储解决方案，
 * 支持本地与远程数据的无缝同步。
 * 
 * @example
 * ```typescript
 * import { HybridDatabaseClient } from '@/core/lib/db/clients/hybrid';
 * 
 * // 使用示例请参考 README.md
 * ```
 */

export { HybridDatabaseClient } from './hybrid-database-client';

// Re-export types that might be useful when working with the hybrid client
import { HybridDatabaseConfig, SyncConfig } from '@/core/lib/db/types/database';
export type { HybridDatabaseConfig, SyncConfig }; 