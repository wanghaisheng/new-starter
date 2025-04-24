/**
 * Firebase 客户端配置
 */
import { DatabaseConfig } from '@/core/lib/db/types/database';
import { FirebaseOptions } from 'firebase/app';

/**
 * Firebase 数据库配置选项
 * 扩展基础数据库配置
 */
export interface FirebaseConfig extends Omit<DatabaseConfig, 'offline'> {
  /**
   * Firebase 应用配置
   * 包含 apiKey, authDomain, projectId 等
   */
  firebaseOptions: FirebaseOptions;
  
  /**
   * Firestore 数据库名称
   * @default '(default)'
   */
  databaseName?: string;
  
  /**
   * 持久化选项
   */
  persistence?: {
    /**
     * 是否启用持久化
     * @default true
     */
    enabled: boolean;
    
    /**
     * 是否启用多标签页支持
     * @default true
     */
    multiTabSupport: boolean;
    
    /**
     * 缓存大小限制，设置为 null 表示无限制
     * @default null
     */
    cacheSizeBytes: number | null;
  };
  
  /**
   * 认证选项
   */
  auth?: {
    /**
     * 是否启用身份验证
     * @default true
     */
    enabled: boolean;
    
    /**
     * 是否使用 emulator
     * @default false
     */
    useEmulator: boolean;
    
    /**
     * emulator 主机
     * @default 'localhost'
     */
    emulatorHost?: string;
    
    /**
     * emulator 端口
     * @default 9099
     */
    emulatorPort?: number;
    
    /**
     * 是否保持用户登录状态
     * @default true
     */
    persistence?: 'local' | 'session' | 'none';
  };
  
  /**
   * Firestore 选项
   */
  firestore?: {
    /**
     * 是否使用 emulator
     * @default false
     */
    useEmulator: boolean;
    
    /**
     * emulator 主机
     * @default 'localhost'
     */
    emulatorHost?: string;
    
    /**
     * emulator 端口
     * @default 8080
     */
    emulatorPort?: number;
    
    /**
     * 是否启用 Firestore 长轮询
     * @default true
     */
    experimentalForceLongPolling?: boolean;
    
    /**
     * 是否自动转换 Firestore 时间戳为 Date 对象
     * @default true
     */
    autoConvertTimestamps?: boolean;
    
    /**
     * 是否忽略未定义字段
     * @default true
     */
    ignoreUndefinedProperties?: boolean;
  };
  
  /**
   * 离线模式选项
   * 必须实现 DatabaseConfig 中定义的离线存储选项
   */
  offline: {
    /**
     * 最大存储大小（字节）
     */
    maxStorageSize: number;
    
    /**
     * 每个表的最大实体数量
     */
    maxEntitiesPerTable: number;
    
    /**
     * 是否启用压缩
     */
    compressionEnabled: boolean;
    
    /**
     * 是否启用加密
     */
    encryptionEnabled: boolean;
    
    /**
     * 是否启用离线模式（Firebase 特有）
     * @default true
     */
    enabled?: boolean;
    
    /**
     * 最大缓存文档数量（Firebase 特有）
     * @default 1000
     */
    maxCacheDocuments?: number;
    
    /**
     * 离线缓存过期时间（毫秒）（Firebase 特有）
     * @default 86400000 (24小时)
     */
    cacheDuration?: number;
  };
  
  /**
   * 性能监控选项
   */
  performance?: {
    /**
     * 是否启用性能监控
     * @default true
     */
    enabled: boolean;
    
    /**
     * 是否记录查询性能
     * @default true
     */
    logQueryPerformance?: boolean;
    
    /**
     * 慢查询阈值（毫秒）
     * @default 500
     */
    slowQueryThreshold?: number;
  };
  
  /**
   * 批处理选项
   */
  batch?: {
    /**
     * 每批最大操作数量
     * @default 450
     */
    batchSize?: number;
    
    /**
     * 是否自动提交批处理
     * @default true
     */
    autoCommit?: boolean;
    
    /**
     * 自动提交阈值（操作数量）
     * @default 400
     */
    autoCommitThreshold?: number;
  };
  
  /**
   * Realtime Database 选项
   */
  realtime?: {
    /**
     * 是否使用 Realtime Database
     * @default false
     */
    enabled: boolean;
    
    /**
     * 数据库 URL
     * 如果不提供，将使用默认 URL
     */
    databaseURL?: string;
    
    /**
     * 是否使用 emulator
     * @default false
     */
    useEmulator: boolean;
    
    /**
     * emulator 主机
     * @default 'localhost'
     */
    emulatorHost?: string;
    
    /**
     * emulator 端口
     * @default 9000
     */
    emulatorPort?: number;
  };
  
  /**
   * Storage 选项
   */
  storage?: {
    /**
     * 是否使用 Cloud Storage
     * @default false
     */
    enabled: boolean;
    
    /**
     * 存储桶名称
     * 如果不提供，将使用默认桶
     */
    bucketName?: string;
    
    /**
     * 最大上传文件大小（字节）
     * @default 10485760 (10MB)
     */
    maxUploadSize?: number;
    
    /**
     * 是否使用 emulator
     * @default false
     */
    useEmulator: boolean;
    
    /**
     * emulator 主机
     * @default 'localhost'
     */
    emulatorHost?: string;
    
    /**
     * emulator 端口
     * @default 9199
     */
    emulatorPort?: number;
  };
} 