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

// ---- 平台类型 ----
export enum AppPlatformEnum {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  UNKNOWN = 'unknown',
}

// ---- 应用环境类型 ----
export enum AppEnvironmentEnum {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
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
export enum DatabaseEventCode {
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
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
  OPERATION_FAILED = 'OPERATION_FAILED',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  NO_ACTIVE_TRANSACTION = 'NO_ACTIVE_TRANSACTION',
  TRANSACTION_COMMIT_ERROR = 'TRANSACTION_COMMIT_ERROR',
  TRANSACTION_ROLLBACK_ERROR = 'TRANSACTION_ROLLBACK_ERROR',
  UPGRADE_IN_PROGRESS = 'UPGRADE_IN_PROGRESS',
  NO_UPGRADE_IN_PROGRESS = 'NO_UPGRADE_IN_PROGRESS',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
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

// ---- 基础设施服务类型 ----
export enum InfrastructureServiceType {
  LOGGER = 'logger',
  DATABASE = 'database',
  CACHE = 'cache',
  QUEUE = 'queue',
  STORAGE = 'storage',
  CONFIG = 'config',
  METRICS = 'metrics',
  TRACING = 'tracing',
  EMAIL = 'email',
  NETWORK = 'network',
  OTHER = 'other',
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

// ---- 网络服务提供方 ----
export enum NetworkProviderType {
  MOCK = 'mock',
  BROWSER = 'browser',
  CAPACITOR = 'capacitor',
  DEFAULT = 'default',
}

// ---- 用户服务类型 ----
export enum UserServiceType {
  MOCK = 'mock',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

// ---- 测验服务类型 ----
export enum QuizServiceType {
  MOCK = 'mock',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

// ---- 认证服务类型 ----
export enum AuthServiceType {
  MOCK = 'mock',
  PERSISTENT_MOCK = 'persistent-mock',
  FIREBASE = 'firebase',
  BETTER = 'better',
  HYBRID = 'hybrid',
}

// ---- 日志服务提供方 ----
export enum LoggerProviderType {
  MOCK = 'mock',
  WINSTON = 'winston',
  PINO = 'pino',
  DEFAULT = 'default',
}

// ---- 匹配服务类型 ----
export enum MatchServiceType {
  MOCK = 'mock',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  BRAND_A = 'brandA',
  BRAND_B = 'brandB',
}

// ---- 匹配服务选项类型 ----
export enum MatchServiceTypeOptions {
  RANDOM = 'random',
  MBTI = 'mbti',
  LOCATION = 'location',
  TAG = 'tag',
  BAZI = 'bazi',
  MOCK = 'mock',
  // ...可扩展其它原子算法类型
}

// ---- 通知服务类型 ----
export enum NotificationServiceType {
  MOCK = 'mock',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

// ---- 支付服务类型 ----
export enum PaymentServiceType {
  REVENUECAT = 'revenuecat',
  CAPACITOR_PURCHASES = 'capacitor-purchases',
  STRIPE = 'stripe',
  WECHAT = 'wechat',
  MOCK = 'mock',
}

// ---- 用户主题 ----
export enum UserTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

// ---- 测验类型 ----
export enum QuizTypeKey {
  PERSONALITY = 'personality',
  COMPATIBILITY = 'compatibility',
  // ... 可补充其它类型
}

// ---- 邮件服务提供方 ----
export enum EmailProvider {
  MOCK = 'mock',
  SMTP = 'smtp',
  DEFAULT = 'default',
}

// ---- 预加载事件与状态 ----
export enum PreloadEventEnum {
  PRELOAD_START = 'preload:start',
  PRELOAD_SUCCESS = 'preload:success',
  PRELOAD_ERROR = 'preload:error',
  CACHE_EXPIRED = 'cache:expired',
  NETWORK_ONLINE = 'network:online',
  NETWORK_OFFLINE = 'network:offline',
}

export enum PreloadStatusEnum {
  IDLE = 'idle',
  PRELOADING = 'preloading',
  SUCCESS = 'success',
  ERROR = 'error',
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

// ---- 用户性别 ----
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

// ---- 用户提供方 ----
export enum UserProvider {
  EMAIL = 'email',
  PHONE = 'phone',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

// ---- 实体通用状态 ----
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

// ---- 消息类型 ----
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
}

// ---- 消息状态 ----
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

// ---- 同步状态类型 ----
export enum SyncStatusEnum {
  SUCCESS = 'success',
  ERROR = 'error',
  IN_PROGRESS = 'in_progress',
}

// ---- 翻译服务类型 ----
export enum TranslationServiceType {
  MOCK = 'mock',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

// ---- 数据初始化模式 ----
export enum DbInitMode {
  SCHEMA = 'schema',
  JSON = 'json',
  MEMORY = 'memory',
  SQL = 'sql',
}

// ---- 消息服务增强器类型 ----
export enum MessageEnhancerType {
  AI = 'ai',
  AUDIT = 'audit',
  CONTENT_SAFETY = 'contentSafety',
  ENCRYPTION = 'encryption',
  I18N = 'i18n',
  MEDIA = 'media',
  MULTI_DEVICE_SYNC = 'multiDeviceSync',
  PRIORITY_GROUP = 'priorityGroup',
  RECALL_EDIT = 'recallEdit',
  TEEN_SAFETY = 'teenSafety',
}

// ---- Quiz 支持类型 ----
export enum QuizType {
  MBTI = 'mbti',
  TCM = 'tcm',
  BAZI = 'bazi',
  CUSTOM = 'custom',
}

// ---- Quiz 高级特性 ----
export enum QuizEnhancerType {
  BASIC_REPORT = 'basicReport',
  AI_ANALYSIS = 'aiAnalysis',
  // 可扩展更多特性
}
