// config-types.ts
// 类型安全的配置项声明，支持类型推断与自动补全

import { CONFIG_KEYS } from './config-keys';

export interface ConfigSchema {
  NEXT_PUBLIC_NODE_ENV?: 'development' | 'production' | 'test';
  NEXT_PUBLIC_ENV_STAGE?: 'mock' | 'local' | 'dev' | 'prod';
  NEXT_PUBLIC_DATA_MODE?: 'online-only' | 'offline-only' | 'hybrid';
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_DB_URL?: string;
  NEXT_PUBLIC_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  NEXT_PUBLIC_PROVIDER_TYPE?: string;
  NEXT_PUBLIC_MOCK_DB_MODE?: 'mock-indexeddb' | 'memory' | 'json';
  NEXT_PUBLIC_ONLINE_DB?: string;
  NEXT_PUBLIC_OFFLINE_DB?: string;
  NEXT_PUBLIC_FEATURE_FLAG?: string;
  NEXT_PUBLIC_BRAND?: string;
  NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT?: boolean | 'true' | 'false';
  NEXT_PUBLIC_SYNC_INTERVAL?: number | string;
  NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION?: 'server-wins' | 'client-wins' | 'merge' | 'last-write-wins';
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  NEXT_PUBLIC_AUTH_TYPE?: string;
  NEXT_PUBLIC_AUTH_SERVICE_TYPE?: string;
  NEXT_PUBLIC_BETTER_AUTH_API_URL?: string;
  NEXT_PUBLIC_DATABASE_ENV?: string;
  NEXT_PUBLIC_MOCK_SQLITE_FILE?: string;
  NEXT_PUBLIC_ENABLE_OFFLINE?: boolean | 'true' | 'false';
  NEXT_PUBLIC_ENABLE_HYBRID?: boolean | 'true' | 'false';
  NEXT_PUBLIC_LOAD_TEST_DATA?: boolean | 'true' | 'false';
  NEXT_PUBLIC_TEST_DATA_SOURCE?: 'example' | 'dating';
  // 服务端专用
  BETTER_AUTH_SECRET?: string;
}

// 类型安全的 get：configService.get<ConfigSchema['NEXT_PUBLIC_API_BASE_URL']>(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL)
