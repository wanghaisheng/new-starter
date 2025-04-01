/**
 * Firebase 辅助类模块
 * 
 * 此模块导出所有 Firebase 相关辅助类，用于支持主 Firebase 客户端的功能
 */

// 实时监听器
export { RealtimeListener } from './realtime-listener';
export type { ListenerOptions } from './realtime-listener';

// 查询构建器
export { FirebaseQueryBuilder } from './query-builder';

// 离线模式管理器
export { FirebaseOfflineManager } from './offline-manager';
export type { OfflineManagerOptions } from './offline-manager';

// 批处理器
export { 
  FirebaseBatchProcessor,
  BatchOperationType
} from './batch-processor';
export type { 
  BatchOperationItem,
  BatchProcessResult,
  BatchProcessorOptions
} from './batch-processor'; 