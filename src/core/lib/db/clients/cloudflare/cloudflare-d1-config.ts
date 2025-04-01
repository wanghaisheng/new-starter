/**
 * Cloudflare D1 配置接口
 */
import { DatabaseConfig } from '@/core/lib/db/types/database.types';

/**
 * Cloudflare D1 数据库配置
 * 定义 Cloudflare D1 数据库客户端所需的配置选项
 */
export interface CloudflareD1Config extends DatabaseConfig {
  /**
   * D1 数据库实例
   * 必须提供一个有效的 D1 数据库实例
   */
  d1Instance: D1Database;
  
  /**
   * 是否使用 Drizzle ORM
   * 如果为 true（默认），将使用 Drizzle ORM 进行数据库操作
   * 如果为 false，将使用原生 SQL 查询
   */
  useDrizzle?: boolean;
  
  /**
   * 是否启用查询缓存
   * 如果启用，重复的查询将从缓存中获取结果
   */
  enableQueryCache?: boolean;
  
  /**
   * 查询缓存过期时间（毫秒）
   * 默认为 60000 毫秒（1分钟）
   */
  queryCacheTTL?: number;
  
  /**
   * 请求超时时间（毫秒）
   * 默认为 30000 毫秒（30秒）
   */
  requestTimeout?: number;
  
  /**
   * 最大重试次数
   * 当请求失败时的重试次数，默认为 3
   */
  maxRetries?: number;
  
  /**
   * 重试延迟（毫秒）
   * 重试之间的延迟时间，默认为 1000 毫秒（1秒）
   */
  retryDelay?: number;
}

/**
 * Cloudflare D1 数据库接口
 * 基于 Cloudflare Workers 运行时的 D1 数据库 API
 */
export interface D1Database {
  /**
   * 预处理 SQL 语句
   * @param query SQL 查询语句
   * @returns 预处理的 SQL 语句
   */
  prepare(query: string): D1PreparedStatement;
  
  /**
   * 批量执行 SQL 语句
   * @param statements 要执行的 SQL 语句数组
   * @returns 执行结果
   */
  batch(statements: D1PreparedStatement[]): Promise<D1Result<any>[]>;
  
  /**
   * 执行 SQL 查询
   * @param query SQL 查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  exec(query: string, params?: any[]): Promise<D1ExecResult>;
}

/**
 * D1 预处理语句接口
 * 表示一个预处理的 SQL 语句
 */
export interface D1PreparedStatement {
  /**
   * 绑定参数
   * @param index 参数索引（从 1 开始）
   * @param value 参数值
   * @returns 预处理语句实例，用于链式调用
   */
  bind(index: number, value: any): D1PreparedStatement;
  
  /**
   * 执行查询并返回所有结果
   * @returns 查询结果
   */
  all<T = any>(): Promise<D1Result<T>>;
  
  /**
   * 执行查询并返回第一个结果
   * @returns 查询结果
   */
  first<T = any>(): Promise<T | null>;
  
  /**
   * 执行查询但不返回结果
   * @returns 执行结果
   */
  run(): Promise<D1ExecResult>;
}

/**
 * D1 查询结果接口
 * 表示 D1 数据库查询的结果
 */
export interface D1Result<T = unknown> {
  /**
   * 查询结果数组
   */
  results?: T[];
  
  /**
   * 成功标志
   */
  success: boolean;
  
  /**
   * 元数据
   */
  meta?: {
    /**
     * 持续时间（毫秒）
     */
    duration: number;
    
    /**
     * 查询的预处理持续时间（毫秒）
     */
    prepared_duration?: number;
    
    /**
     * 查询的执行持续时间（毫秒）
     */
    execution_duration?: number;
    
    /**
     * 查询的读取持续时间（毫秒）
     */
    read_duration?: number;
  };
}

/**
 * D1 执行结果接口
 * 表示执行 SQL 语句的结果
 */
export interface D1ExecResult {
  /**
   * 成功标志
   */
  success: boolean;
  
  /**
   * 服务器的持久化ID
   */
  served_by?: string;
  
  /**
   * 受影响的行数
   */
  changes: number;
  
  /**
   * 上次插入的行ID
   */
  last_row_id?: number;
  
  /**
   * 错误消息（如果有）
   */
  error?: string;
  
  /**
   * 元数据
   */
  meta?: {
    /**
     * 持续时间（毫秒）
     */
    duration: number;
    
    /**
     * 查询的预处理持续时间（毫秒）
     */
    prepared_duration?: number;
    
    /**
     * 查询的执行持续时间（毫秒）
     */
    execution_duration?: number;
  };
} 