import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { ConfigSchema } from '@/core/services/infrastructure/config/config-types';

/**
 * DataServiceConfig 的所有值应通过配置服务/环境变量/推导获得，避免硬编码。
 * 字段与 docs/guides/environment-variables.md、environment-modes.md、service-modes.md 及 ConfigSchema 保持同步。
 */
export interface DataServiceConfig {
  /** 当前数据运行模式，对应 ConfigSchema['NEXT_PUBLIC_DATA_MODE'] */
  mode: ConfigSchema['NEXT_PUBLIC_DATA_MODE'];
  /** 当前环境阶段，对应 ConfigSchema['NEXT_PUBLIC_ENV_STAGE'] */
  envStage: ConfigSchema['NEXT_PUBLIC_ENV_STAGE'];
  /** 数据服务适配器配置 */
  services: {
    data: {
      /** 在线数据库 provider，如 'supabase'、'firebase'，对应 ConfigSchema['NEXT_PUBLIC_ONLINE_DB_PROVIDER'] */
      onlineProvider: ConfigSchema['NEXT_PUBLIC_ONLINE_DB_PROVIDER'];
      /** 离线数据库 provider，如 'sqlite'、'indexeddb'，对应 ConfigSchema['NEXT_PUBLIC_OFFLINE_DB_PROVIDER'] */
      offlineProvider: ConfigSchema['NEXT_PUBLIC_OFFLINE_DB_PROVIDER'];
      /** ORM 类型，如 'drizzle'、'typeorm'，对应 ConfigSchema['NEXT_PUBLIC_DB_ORM'] */
      orm?: ConfigSchema['NEXT_PUBLIC_DB_ORM'];
      /**
       * 需同步的实体类型列表（如 ['users', 'orders']），用于 SyncManager
       */
      entityTypes?: string[];
      /** 其它 provider 相关配置 */
      options?: {
        firebase?: {
          apiKey: ConfigSchema['NEXT_PUBLIC_FIREBASE_API_KEY'];
          authDomain: ConfigSchema['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'];
          projectId: ConfigSchema['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
          storageBucket: ConfigSchema['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'];
          messagingSenderId: ConfigSchema['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'];
          appId: ConfigSchema['NEXT_PUBLIC_FIREBASE_APP_ID'];
        };
        sqlite?: {
          name: ConfigSchema['NEXT_PUBLIC_SQLITE_DB_NAME'];
          location?: ConfigSchema['NEXT_PUBLIC_SQLITE_DB_LOCATION'];
          encryptionKey?: ConfigSchema['NEXT_PUBLIC_SQLITE_ENCRYPTION_KEY'];
        };
        indexeddb?: {
          name: ConfigSchema['NEXT_PUBLIC_INDEXEDDB_DB_NAME'];
          version?: ConfigSchema['NEXT_PUBLIC_INDEXEDDB_VERSION'];
          engine?: ConfigSchema['NEXT_PUBLIC_INDEXEDDB_ENGINE'];
          autoSave?: ConfigSchema['NEXT_PUBLIC_INDEXEDDB_AUTO_SAVE'];
          encryptionKey?: ConfigSchema['NEXT_PUBLIC_INDEXEDDB_ENCRYPTION_KEY'];
        };
        d1?: {
          url?: ConfigSchema['NEXT_PUBLIC_D1_DB_URL'];
          name?: ConfigSchema['NEXT_PUBLIC_D1_DB_NAME'];
          region?: ConfigSchema['NEXT_PUBLIC_D1_DB_REGION'];
        };
        turso?: {
          url?: ConfigSchema['NEXT_PUBLIC_TURSO_DB_URL'];
          token?: ConfigSchema['NEXT_PUBLIC_TURSO_DB_TOKEN'];
          name?: ConfigSchema['NEXT_PUBLIC_TURSO_DB_NAME'];
        };
        supabase?: {
          url?: ConfigSchema['NEXT_PUBLIC_SUPABASE_URL'];
          anonKey?: ConfigSchema['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
          serviceRoleKey?: ConfigSchema['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'];
          projectId?: ConfigSchema['NEXT_PUBLIC_SUPABASE_PROJECT_ID'];
        };
        tidb?: {
          host?: ConfigSchema['NEXT_PUBLIC_TIDB_HOST'];
          port?: ConfigSchema['NEXT_PUBLIC_TIDB_PORT'];
          user?: ConfigSchema['NEXT_PUBLIC_TIDB_USER'];
          password?: ConfigSchema['NEXT_PUBLIC_TIDB_PASSWORD'];
          database?: ConfigSchema['NEXT_PUBLIC_TIDB_DATABASE'];
          url?: ConfigSchema['NEXT_PUBLIC_TIDB_URL'];
        };
        /** 缓存 provider，如 'redis'、'localstorage'，对应 ConfigSchema['NEXT_PUBLIC_CACHE_PROVIDER'] */
        cacheProvider?: import('@/core/lib/db/types/common').CacheProvider | string;
        /**
         * 是否启用同步，对应 ConfigSchema['NEXT_PUBLIC_SYNC_ENABLED']
         */
        syncEnabled?: ConfigSchema['NEXT_PUBLIC_SYNC_ENABLED'];
        /**
         * 自动同步开关，对应 ConfigSchema['NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT']
         */
        autoSync?: ConfigSchema['NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT'];
        /**
         * 同步间隔（毫秒），对应 ConfigSchema['NEXT_PUBLIC_SYNC_INTERVAL']
         */
        syncInterval?: ConfigSchema['NEXT_PUBLIC_SYNC_INTERVAL'];
        /**
         * 同步冲突解决策略，对应 ConfigSchema['NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION']
         */
        syncConflictResolution?: import('@/core/lib/db/types/common').ConflictResolution | string;
        /**
         * 多级缓存策略（如 memory/localstorage/redis），对应 ConfigSchema['CACHE_STRATEGY']
         */
        cacheStrategy?: import('@/core/lib/db/types/common').CacheStrategy | string;
        /**
         * 断网自动切换，是否启用 hybrid/offline fallback，对应 ConfigSchema['OFFLINE_FALLBACK']
         */
        offlineFallback?: ConfigSchema['OFFLINE_FALLBACK'];
        /**
         * 失效策略（如 ttl/lru），对应 ConfigSchema['EXPIRY_STRATEGY']
         */
        expiryStrategy?: import('@/core/lib/db/types/common').ExpiryStrategy | string;
        /**
         * 平台类型，如 'web'、'mobile'，对应 ConfigSchema['NEXT_PUBLIC_PLATFORM']
         */
        platform?: ConfigSchema['NEXT_PUBLIC_PLATFORM'];
        /**
         * 多级缓存层级，支持 ['memory', 'redis', 'localstorage'] 等（自定义可扩展）
         */
        cacheLayers?: string[];
        /**
         * 是否启用缓存预热
         */
        cachePreheat?: boolean;
        /**
         * 数据同步策略，如 'auto' | 'manual' | 'interval'，对应 ConfigSchema['NEXT_PUBLIC_SYNC_STRATEGY']
         */
        syncStrategy?: import('@/core/lib/db/types/common').SyncStrategy | string;
        /**
         * 是否启用冲突检测/解决
         */
        conflictDetection?: boolean;
        /**
         * 启用 mock 数据模式，适用于演练/测试/CI
         */
        enableMock?: boolean;
        /**
         * 只读模式
         */
        readonly?: boolean;
        /**
         * 分布式/多活支持
         */
        distributed?: boolean;
        /**
         * 容灾/主备切换策略
         */
        failoverStrategy?: 'auto' | 'manual' | string;
        /**
         * 数据版本号/快照标识
         */
        dataVersion?: string | number;
        /** 其它扩展字段 */
        [key: string]: any;
      };
    };
  };
}

/**
 * 事件类型与监听器类型映射
 */
export interface IDataServiceEventListenerMap {
  initialized: () => void;
  closed: () => void;
  error: (error: import('@/core/lib/db/types/database').DatabaseError) => void;
  upgrade: () => void;
  downgrade: () => void;
  migrating: () => void;
  migrated: () => void;
  synced: () => void;
  conflict: (conflictInfo: any) => void;
  updated: (entity: BaseEntity) => void;
  // --- 扩展事件声明，彻底类型安全 ---
  sync: (info: any) => void;
  syncProgress: (progress: import('@/core/services/data/types').SyncProgress) => void;
  cacheUpdated: (event: CacheUpdateEvent) => void;
  cacheDeleted: (event: CacheUpdateEvent) => void;
  cacheInvalidated: (info: { collection: string; id: string }) => void;
  delete: (id: string) => void;
}

export type IDataServiceEvent = keyof IDataServiceEventListenerMap;

export interface IDataService<T extends BaseEntity> {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
  findById(tableName: string, id: string): Promise<T | null>;
  query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  create(tableName: string, data: T): Promise<T>;
  update(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  batch(tableName: string, operations: any[]): Promise<void>;
  executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
  getType(): string;
  isInitialized(): boolean;
  getConfig(): any;
  initialize(config?: any): Promise<void>;
  dispose?(): Promise<void>;

  /**
   * 事件订阅：监听数据服务事件（类型安全）。
   * 返回取消订阅函数。
   */
  on?: <E extends IDataServiceEvent>(event: E, listener: IDataServiceEventListenerMap[E]) => () => void;

  /**
   * 事件取消订阅：移除数据服务事件监听（类型安全）。
   */
  off?: <E extends IDataServiceEvent>(event: E, listener: IDataServiceEventListenerMap[E]) => void;

  findAll?(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  get?(key: string): Promise<any>;
  set?(key: string, value: any): Promise<void>;

  /** 健康检查，返回健康状态和原因 */
  checkHealth?: () => Promise<{ healthy: boolean; reason?: string }>;

  /** 手动同步（如 Hybrid/离线场景） */
  sync?: () => Promise<void>;

  /** 获取元数据（支持的表、字段、能力等） */
  getMetadata?: () => Promise<any>;

  /** 获取运行状态/统计信息 */
  getStats?: () => Promise<any>;

  /** 权限校验（如有多租户/安全需求） */
  hasPermission?: (action: string, resource: string) => Promise<boolean>;

  /** 软重置（如切换账号/环境/清理缓存） */
  reset?: () => Promise<void>;

  /** 资源释放，适配器销毁时自动调用 */
  dispose?: () => Promise<void>;
}

// 多端缓存一致性事件结构
export interface CacheUpdateEvent<T = any> {
  collection: string;
  id: string;
  type: 'set' | 'delete';
  data?: T;
  origin: string;
  timestamp: number;
}

// 同步进度类型声明
export interface SyncProgress {
  entityType: string;
  current: number;
  total: number;
  percent: number;
}

// 内存缓存接口（用于多级缓存与 cache-to-cache 能力）
export interface IMemoryCache {
  setCache(collection: string, id: string, value: any): void;
  getCache(collection: string, id: string): any;
  hasCache(collection: string, id: string): boolean;
  getAllCache?(collection: string): Promise<any[]>;
  clear?(): Promise<void>;
  disconnect?(): Promise<void>;
  on?<E extends IDataServiceEvent>(event: E, handler: IDataServiceEventListenerMap[E]): () => void;
  off?<E extends IDataServiceEvent>(event: E, handler: IDataServiceEventListenerMap[E]): void;
  dispose?(): Promise<void>;
}