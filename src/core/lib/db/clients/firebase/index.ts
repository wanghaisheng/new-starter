/**
 * Firebase 数据库客户端模块
 * 
 * 此模块导出 FirebaseClient 及其相关类型和辅助工具，提供对 Firebase 数据库的访问
 */

// 导出主客户端
export { FirebaseClient } from './firebase-client';

// 导出配置类型
export type { FirebaseConfig } from './firebase-config';

// 导出环境配置
export { getFirebaseConfig } from './firebase-env-config';

// 导出辅助类
export { FirebaseAuthService } from './firebase-auth';
export { FirebasePermissionsService } from './firebase-permissions';
export { FirebaseSyncService } from './firebase-sync';
export { FirebaseConflictService } from './firebase-conflict';
export { FirebasePerformanceService } from './firebase-performance';
export { FirebaseDeploymentService } from './firebase-deployment';

// 导出 Realtime Database 服务
export { FirebaseRealtimeDBService } from './firebase-realtime-db';
export type { RealtimeListenerConfig } from './firebase-realtime-db';

// 导出 Cloud Storage 服务
export { FirebaseStorageService } from './firebase-storage';
export type { FileMetadata, UploadOptions } from './firebase-storage';

// 导出辅助工具类
export { 
  RealtimeListener,
  FirebaseQueryBuilder, 
  FirebaseOfflineManager,
  FirebaseBatchProcessor,
  BatchOperationType
} from './firebase-helpers';

// 导出辅助工具接口
export type { 
  ListenerOptions,
  OfflineManagerOptions,
  BatchOperationItem,
  BatchProcessResult,
  BatchProcessorOptions
} from './firebase-helpers'; 