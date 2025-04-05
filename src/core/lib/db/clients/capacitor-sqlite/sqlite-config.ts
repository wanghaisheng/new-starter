/**
 * SQLite 配置文件
 * 
 * 本文件定义 SQLite 数据库的配置选项，包括数据库名称、版本、加密设置等。
 * 它遵循项目的配置模式，提供开发、测试和生产环境的不同配置。
 */
import { isDevelopment } from '@/core/lib/platform';

/**
 * SQLite 数据库配置接口
 */
export interface SQLiteConfig {
  /**
   * 数据库配置
   */
  database: {
    /**
     * 数据库名称
     */
    name: string;
    
    /**
     * 数据库版本号
     */
    version: number;
  };
  
  /**
   * 加密设置
   */
  encryption?: {
    /**
     * 是否启用加密
     */
    enabled: boolean;
    
    /**
     * 加密密钥（仅在启用加密时使用）
     */
    key?: string;
  };
  
  /**
   * 性能设置
   */
  performance?: {
    /**
     * 查询缓存大小
     */
    queryCacheSize?: number;
    
    /**
     * 启用 WAL 模式
     */
    enableWAL?: boolean;
    
    /**
     * 同步模式
     * - NORMAL: 默认模式，平衡安全性和性能
     * - FULL: 最安全但最慢
     * - OFF: 最快但最不安全（可能导致数据损坏）
     */
    syncMode?: 'NORMAL' | 'FULL' | 'OFF';
  };
  
  /**
   * 同步设置
   */
  sync?: {
    /**
     * 是否在应用启动时自动检查和应用架构更新
     */
    autoSchemaUpdate?: boolean;
    
    /**
     * 是否在应用启动时清除数据库（仅开发时使用！）
     */
    clearOnStart?: boolean;
  };
  
  /**
   * 调试设置
   */
  debug?: {
    /**
     * 是否启用 SQL 查询日志
     */
    enableLogging?: boolean;
    
    /**
     * 是否记录详细的错误信息
     */
    verboseErrors?: boolean;
  };
}

/**
 * SQLite 默认配置
 */
export const DEFAULT_SQLITE_CONFIG: SQLiteConfig = {
  database: {
    name: 'heytcm_db',
    version: 1
  },
  encryption: {
    enabled: false
  },
  performance: {
    enableWAL: true,
    syncMode: 'NORMAL'
  },
  sync: {
    autoSchemaUpdate: true,
    clearOnStart: isDevelopment() // 仅在开发模式下允许清除数据库
  },
  debug: {
    enableLogging: isDevelopment(), // 仅在开发模式下启用日志
    verboseErrors: isDevelopment()
  }
};

/**
 * 导出当前环境下的 SQLite 配置
 */
export const SQLITE_CONFIG: SQLiteConfig = DEFAULT_SQLITE_CONFIG; 