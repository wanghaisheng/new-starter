// config-types.ts
// 配置服务专属类型声明，仅保留 ConfigSchema
import {
  DataMode,
  DbProvider,
  DbOrm,
  LogLevel,
  Platform,
  AuthType,
  NodeEnv,
  EnvStage,
  OnlineDbProvider,
  OfflineDbProvider,
  ConflictResolution,
  SyncStrategy,
  CacheProvider,
  ConfigProviderType,
  AuthServiceType,
  UserServiceType,
  NotificationServiceType,
  PaymentServiceType,
  QuizServiceType,
  CacheStrategy,
  ExpiryStrategy,
  DbInitMode,
  MatchServiceType // 新增匹配服务类型枚举
} from '@/core/lib/db/types/common';

export interface ConfigSchema {
  NEXT_PUBLIC_NODE_ENV?: NodeEnv | string;
  NEXT_PUBLIC_ENV_STAGE?: EnvStage | string;
  NEXT_PUBLIC_DATA_MODE?: DataMode | string;
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_DB_URL?: string; // 通用数据库连接字符串
  NEXT_PUBLIC_DATABASE_ENV?: string;

  // 配置服务 provider 相关变量
  NEXT_PUBLIC_CONFIG_PROVIDER?: ConfigProviderType | string;

  // 主流数据库 provider 相关变量
  NEXT_PUBLIC_SQLITE_DB_NAME?: string;
  NEXT_PUBLIC_SQLITE_DB_LOCATION?: string;
  NEXT_PUBLIC_SQLITE_ENCRYPTION_KEY?: string;

  NEXT_PUBLIC_INDEXEDDB_DB_NAME?: string;
  NEXT_PUBLIC_INDEXEDDB_VERSION?: number;
  NEXT_PUBLIC_INDEXEDDB_ENGINE?: string;
  NEXT_PUBLIC_INDEXEDDB_AUTO_SAVE?: boolean;
  NEXT_PUBLIC_INDEXEDDB_ENCRYPTION_KEY?: string;

  NEXT_PUBLIC_D1_DB_URL?: string;
  NEXT_PUBLIC_D1_DB_NAME?: string;
  NEXT_PUBLIC_D1_DB_REGION?: string;
  NEXT_PUBLIC_TURSO_DB_URL?: string;
  NEXT_PUBLIC_TURSO_DB_TOKEN?: string;
  NEXT_PUBLIC_TURSO_DB_NAME?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  NEXT_PUBLIC_TIDB_HOST?: string;
  NEXT_PUBLIC_TIDB_PORT?: number;
  NEXT_PUBLIC_TIDB_USER?: string;
  NEXT_PUBLIC_TIDB_PASSWORD?: string;
  NEXT_PUBLIC_TIDB_DATABASE?: string;
  NEXT_PUBLIC_TIDB_URL?: string;

  NEXT_PUBLIC_ONLINE_DB_PROVIDER?: OnlineDbProvider | string;
  NEXT_PUBLIC_OFFLINE_DB_PROVIDER?: OfflineDbProvider | string;
  NEXT_PUBLIC_DB_ORM?: DbOrm | string;
  NEXT_PUBLIC_CACHE_PROVIDER?: CacheProvider | string;
  NEXT_PUBLIC_LOG_LEVEL?: LogLevel | string;
  NEXT_PUBLIC_PLATFORM?: Platform | string;
  NEXT_PUBLIC_API_ENV?: string;
  NEXT_PUBLIC_PROVIDER_TYPE?: string;
  NEXT_PUBLIC_FEATURE_FLAG?: string;
  NEXT_PUBLIC_BRAND?: string;
  NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT?: boolean | 'true' | 'false';
  NEXT_PUBLIC_SYNC_INTERVAL?: number | string;
  NEXT_PUBLIC_SYNC_ENABLED?: boolean | 'true' | 'false';
  NEXT_PUBLIC_SYNC_STRATEGY?: SyncStrategy;
  NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION?: ConflictResolution | string;
  NEXT_PUBLIC_ENABLE_OFFLINE?: boolean | 'true' | 'false';
  NEXT_PUBLIC_ENABLE_HYBRID?: boolean | 'true' | 'false';
  NEXT_PUBLIC_CONFLICT_RESOLUTION?: string;
  NEXT_PUBLIC_LOAD_TEST_DATA?: boolean | 'true' | 'false';
  NEXT_PUBLIC_TEST_DATA_SOURCE?: string;
  NEXT_PUBLIC_QUIZ_API_BASE_URL?: string;
  NEXT_PUBLIC_QUIZ_AI_BASE_URL?: string;
  NEXT_PUBLIC_APP_VERSION?: string;
  NEXT_PUBLIC_BUILD_NUMBER?: string | number;
  NEXT_PUBLIC_USE_MOCK_NETWORK?: boolean | 'true' | 'false';
  NEXT_PUBLIC_USE_MOCK_DB?: boolean | 'true' | 'false';
  NEXT_PUBLIC_AUTH_TYPE?: AuthType | string;
  NEXT_PUBLIC_AUTH_SERVICE_TYPE?: AuthServiceType | string;
  NEXT_PUBLIC_USER_SERVICE_TYPE?: UserServiceType | string;
  NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE?: NotificationServiceType | string;
  NEXT_PUBLIC_PAYMENT_SERVICE_TYPE?: PaymentServiceType | string;
  NEXT_PUBLIC_QUIZ_SERVICE_TYPE?: QuizServiceType | string;
  NEXT_PUBLIC_BETTER_AUTH_API_URL?: string;
  LOGGER_PROVIDER?: string;
  LOG_LEVEL?: string;
  EMAIL_PROVIDER?: string;
  R2_REGION?: string;
  R2_ENDPOINT?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_PUBLIC_BASE_URL?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  GITHUB_PATH?: string;
  GITHUB_RAW_BASE?: string;
  TG_BOT_TOKEN?: string;
  TG_CHAT_ID?: string;
  CACHE_STRATEGY?: CacheStrategy | string;
  OFFLINE_FALLBACK?: boolean | 'true' | 'false';
  EXPIRY_STRATEGY?: ExpiryStrategy | string;
  BETTER_AUTH_SECRET?: string;
  SYNC_ENTITY_TYPES?: string; // 需同步的表名，逗号分隔，如 'users,orders,logs'
  /**
   * 需同步的实体类型列表（如 ['users', 'orders']），用于 SyncManager
   */
  NEXT_PUBLIC_ENTITY_TYPES?: string[];

  NEXT_PUBLIC_MATCH_SERVICE_TYPE?: MatchServiceType[] | string[] | string;
  NEXT_PUBLIC_MATCH_POOL_SIZE?: number | string;
  NEXT_PUBLIC_MATCH_AI_MODEL?: string;
  NEXT_PUBLIC_MATCH_REFRESH_INTERVAL?: number | string;

  // 数据初始化相关变量
  NEXT_PUBLIC_DB_INIT_MODE?: DbInitMode | string;
  NEXT_PUBLIC_DB_INIT_SOURCE?: string;
  NEXT_PUBLIC_DB_INIT_LOAD_DEFAULT?: boolean | string;
  NEXT_PUBLIC_DB_INIT_TABLES?: string;
}
