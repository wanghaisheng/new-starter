// =================== 通用数据库类型与配置枚举 ===================

// ---- Provider/Engine（DbProvider + DatabaseEngine 合并） ----
export enum DbProvider {
  SQLITE = 'sqlite',
  INDEXEDDB = 'indexeddb',
  D1 = 'd1',
  SUPABASE = 'supabase',
  FIREBASE = 'firebase',
  TIDB = 'tidb',
  TURSO = 'turso',
  MOCK = 'mock',
  CUSTOM = 'custom',
}

export enum SyncStrategy {
  AUTO = 'auto',        // 自动同步
  MANUAL = 'manual',    // 手动同步
  INTERVAL = 'interval' // 定时同步
  // 可根据实际业务扩展
}
// ---- 数据流向/环境 ----
export enum DataMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
  HYBRID = 'hybrid',
}

// ---- Provider/ORM ----
export enum DbOrm {
  DRIZZLE = 'drizzle',
  TYPEORM = 'typeorm',
  KYSELY = 'kysely',
  NONE = 'none',
  NATIVE = 'native',
  FAKE = 'fake',
}

// ---- 日志级别 ----
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// ---- 平台 ----
export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
}

// ---- 认证类型 ----
export enum AuthType {
  JWT = 'jwt',
  OAUTH = 'oauth',
  SESSION = 'session',
  MOCK = 'mock',
}

// ---- 列类型 ----
export enum ColumnType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TEXT = 'text',
  JSON = 'json',
  BLOB = 'blob',
}

// ---- 同步与冲突相关 ----
export enum ConflictResolution {
  SERVER_WINS = 'server-wins',
  CLIENT_WINS = 'client-wins',
  MERGE = 'merge',
  LAST_WRITE_WINS = 'last-write-wins',
}
export enum SyncPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
export enum SyncState {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

// ---- 缓存 Provider ----
export enum CacheProvider {
  MEMORY = 'memory',
  INDEXEDDB = 'indexeddb',
  LOCALSTORAGE = 'localstorage',
  SESSIONSTORAGE = 'sessionstorage',
  REDIS = 'redis',
  FAKE = 'fake',
  NONE = 'none',
}

// ---- 配置服务 provider 类型 ----
export enum ConfigProviderType {
  ENV = 'env',
  MOCK = 'mock',
  REMOTE = 'remote',
  DEFAULT = 'default',
  // 可扩展 localfile/consul/etcd/ssm
}

// ---- 在线数据库 Provider（合并 OnlineStorageType + SupportedOnlineStorageType） ----
export enum OnlineDbProvider {
  SUPABASE = 'supabase',
  FIREBASE = 'firebase',
  TIDB = 'tidb',
  D1 = 'd1',
  TURSO = 'turso',
  CUSTOM = 'custom',
}

// ---- 离线数据库 Provider（合并 OfflineStorageType + SupportedOfflineStorageType） ----
export enum OfflineDbProvider {
  INDEXEDDB = 'indexeddb',
  CAPACITOR_SQLITE = 'capacitor-sqlite',
  MOCK = 'mock',
  LOCALSTORAGE = 'localstorage',
  SQLITE = 'sqlite',
}

// ---- 数据库存储类型 ----
export enum HybridStrategy {
  ONLINE_FIRST = 'online-first',
  OFFLINE_FIRST = 'offline-first',
  MANUAL = 'manual',
}

// ---- 查询相关 ----
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}
export enum QueryOperator {
  EQ = '==',
  LT = '<',
  LTE = '<=',
  GT = '>',
  GTE = '>=',
  NEQ = '!=',
  IN = 'in',
  NIN = 'not-in',
  LIKE = 'like',
  BETWEEN = 'between',
  EXISTS = 'exists',
}

// ---- 数据库事件与错误码 ----
export enum DatabaseEvent {
  INITIALIZED = 'initialized',
  CLOSED = 'closed',
  ERROR = 'error',
  MIGRATED = 'migrated',
  SYNCED = 'synced',
  CONFLICT = 'conflict',
  UPDATED = 'updated',
}
export enum DatabaseErrorCode {
  UNKNOWN = 'UNKNOWN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NETWORK = 'NETWORK',
  MIGRATION = 'MIGRATION',
  SYNC = 'SYNC',
  LOCKED = 'LOCKED',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  UNSUPPORTED = 'UNSUPPORTED',
}

// ---- 临时/会话缓存 Provider ----
export enum TempCacheProvider {
  MEMORY = 'memory',
  REDIS = 'redis',
  LOCALSTORAGE = 'localstorage',
}

// ---- 文件存储 Provider ----
export enum FileStorageProvider {
  S3 = 's3',
  OSS = 'oss',
  GCS = 'gcs',
  LOCAL = 'local',
}

// ---- 日志存储 Provider ----
export enum LogStorageProvider {
  SENTRY = 'sentry',
  ELK = 'elk',
  CONSOLE = 'console',
}

// ---- 队列 Provider ----
export enum QueueProvider {
  RABBITMQ = 'rabbitmq',
  KAFKA = 'kafka',
  REDIS = 'redis',
}

// ---- 搜索 Provider ----
export enum SearchProvider {
  ELASTICSEARCH = 'elasticsearch',
  ALGOLIA = 'algolia',
}

// ---- 归档 Provider ----
export enum ArchiveProvider {
  OSS = 'oss',
  S3 = 's3',
  HDFS = 'hdfs',
  GLACIER = 'glacier',
}

// ---- 元数据 Provider ----
export enum MetadataProvider {
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  JSONFILE = 'jsonfile',
}

// ---- 密钥 Provider ----
export enum SecretProvider {
  VAULT = 'vault',
  AWS_SECRETS_MANAGER = 'aws-secrets-manager',
  ENV = 'env',
}

// ---- 缓存策略 ----
export enum CacheStrategy {
  MEMORY = 'memory',
  LOCALSTORAGE = 'localstorage',
  REDIS = 'redis',
}

// ---- 失效策略 ----
export enum ExpiryStrategy {
  NONE = 'none',
  TTL = 'ttl',
  LRU = 'lru',
}

// ---- 用户服务类型 ----
export enum UserServiceType {
  MOCK = 'mock',
  FIREBASE = 'firebase',
}

// ---- 消息服务类型 ----
export enum MessageServiceType {
  MOCK = 'mock',
}

// ---- 通知服务类型 ----
export enum NotificationServiceType {
  MOCK = 'mock',
}

// ---- 支付服务类型 ----
export enum PaymentServiceType {
  REVENUECAT = 'revenuecat',
  MOCK = 'mock',
}

// ---- 测验服务类型 ----
export enum QuizServiceType {
  MOCK = 'mock',
}

// ---- 认证服务类型 ----
export enum AuthServiceType {
  FIREBASE = 'firebase',
  NEXTAUTH = 'nextauth',
  BETTERAUTH = 'betterauth',
}

// ---- 环境变量相关枚举 ----
export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

// ---- 环境阶段相关枚举 ----
export enum EnvStage {
  MOCK = 'mock',
  LOCAL = 'local',
  DEV = 'dev',
  PROD = 'prod',
}
