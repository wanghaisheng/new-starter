// config-types.ts
// 类型安全的配置项声明，支持类型推断与自动补全

import { CONFIG_KEYS } from './config-keys';

export interface ConfigSchema {
  NEXT_PUBLIC_NODE_ENV?: 'development' | 'production' | 'test';
  NEXT_PUBLIC_ENV_STAGE?: 'mock' | 'local' | 'dev' | 'prod';
  NEXT_PUBLIC_DATA_MODE?: 'online-only' | 'offline-only' | 'hybrid';
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_DB_URL?: string;
  NEXT_PUBLIC_DATABASE_ENV?: string;
  // 废弃：NEXT_PUBLIC_DATABASE_PROVIDER、NEXT_PUBLIC_ONLINE_DB、NEXT_PUBLIC_OFFLINE_DB、NEXT_PUBLIC_OFFLINE_DB_TYPE
  // 推荐使用新版 provider/orm 变量：
  NEXT_PUBLIC_ONLINE_DB_PROVIDER?: 'supabase' | 'firebase' | string;
  NEXT_PUBLIC_OFFLINE_DB_PROVIDER?: 'sqlite' | 'indexeddb' | string;
  NEXT_PUBLIC_DB_ORM?: 'drizzle' | 'typeorm' | 'none' | string;
  NEXT_PUBLIC_CACHE_PROVIDER?: 'redis' | 'localstorage' | string;
  // [已彻底废弃] 
  // NEXT_PUBLIC_MOCK_DB_MODE?: string; 
  // NEXT_PUBLIC_MOCK_SQLITE_FILE?: string;
  NEXT_PUBLIC_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  NEXT_PUBLIC_PROVIDER_TYPE?: string;
  NEXT_PUBLIC_API_ENV?: string;
  NEXT_PUBLIC_PLATFORM?: string;
  NEXT_PUBLIC_FEATURE_FLAG?: string;
  NEXT_PUBLIC_BRAND?: string;
  NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT?: boolean | 'true' | 'false';
  NEXT_PUBLIC_SYNC_INTERVAL?: number | string;
  NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION?: 'server-wins' | 'client-wins' | 'merge' | 'last-write-wins';
  NEXT_PUBLIC_SYNC_ENABLED?: boolean | 'true' | 'false';
  NEXT_PUBLIC_SYNC_STRATEGY?: string;
  NEXT_PUBLIC_ENABLE_OFFLINE?: boolean | 'true' | 'false';
  NEXT_PUBLIC_ENABLE_HYBRID?: boolean | 'true' | 'false';
  NEXT_PUBLIC_CONFLICT_RESOLUTION?: string;
  NEXT_PUBLIC_LOAD_TEST_DATA?: boolean | 'true' | 'false';
  NEXT_PUBLIC_TEST_DATA_SOURCE?: 'example' | 'dating' | string;
  NEXT_PUBLIC_QUIZ_API_BASE_URL?: string;
  NEXT_PUBLIC_QUIZ_AI_BASE_URL?: string;
  NEXT_PUBLIC_APP_VERSION?: string;
  NEXT_PUBLIC_BUILD_NUMBER?: string | number;
  NEXT_PUBLIC_USE_MOCK_NETWORK?: boolean | 'true' | 'false';
  NEXT_PUBLIC_USE_MOCK_DB?: boolean | 'true' | 'false';

  // 认证/服务类型
  NEXT_PUBLIC_AUTH_TYPE?: string;
  NEXT_PUBLIC_AUTH_SERVICE_TYPE?: string;
  NEXT_PUBLIC_USER_SERVICE_TYPE?: string;
  NEXT_PUBLIC_MESSAGE_SERVICE_TYPE?: string;
  NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE?: string;
  NEXT_PUBLIC_PAYMENT_SERVICE_TYPE?: string;
  NEXT_PUBLIC_QUIZ_SERVICE_TYPE?: string;
  NEXT_PUBLIC_BETTER_AUTH_API_URL?: string;

  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;

  // 服务端专用
  BETTER_AUTH_SECRET?: string;
  // 日志/邮件/对象存储
  LOG_LEVEL?: string;
  LOGGER_PROVIDER?: string;
  EMAIL_PROVIDER?: string;
  R2_REGION?: string;
  R2_ENDPOINT?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_PUBLIC_BASE_URL?: string;

  // GitHub/Telegram 等第三方
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  GITHUB_PATH?: string;
  GITHUB_RAW_BASE?: string;
  TG_BOT_TOKEN?: string;
  TG_CHAT_ID?: string;
}

// 类型安全的 get：configService.get<ConfigSchema['NEXT_PUBLIC_API_BASE_URL']>(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL)
