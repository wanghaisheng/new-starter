import { PreloadEventEnum, PreloadStatusEnum } from '@/core/lib/db/types/common';

export type PreloadEvent = PreloadEventEnum;

export type PreloadCallback = (payload?: any) => void;

/**
 * 单张表预加载配置
 */
export interface TablePreloadConfig {
  /** 表名 */
  name: string;
  /** 最大缓存记录数（优先级高于全局 maxRecordsPerTable） */
  maxRecords?: number;
  /** 缓存有效期（毫秒） */
  cacheTTL?: number;
  /** 预加载优先级，数值越大越优先 */
  priority?: number;
  /** 依赖的其它表名，只有依赖表加载完成后才会加载本表 */
  dependsOn?: string[];
}

/**
 * 全局预加载配置
 */
export interface DataPreloadConfig {
  /** 是否启用预加载 */
  enabled?: boolean;
  /** 需要预加载的表，可以是表名或详细配置对象 */
  preloadTables: (string | TablePreloadConfig)[];
  /** 每张表最大缓存记录数（可被表级配置覆盖） */
  maxRecordsPerTable?: number;
  /** 自动预加载间隔（毫秒） */
  autoPreloadInterval?: number;
  /** 全局缓存有效期（毫秒） */
  cacheTTL?: number;
  /** 缓存 key 前缀 */
  cacheKeyPrefix?: string;
  /** 网络重连时自动预加载 */
  preloadOnNetworkReconnect?: boolean;
  /** 最大缓存表数量，超出时自动清理最旧缓存 */
  maxCacheTables?: number;
}

/**
 * 单表缓存条目
 */
export interface PreloadCacheEntry<T = any> {
  /** 缓存数据 */
  data: T[];
  /** 缓存时间戳 */
  timestamp: number;
  /** 缓存异常信息（可选） */
  error?: any;
}

/** 预加载状态类型 */
export type PreloadStatus = PreloadStatusEnum;

/**
 * 统一的预加载结果类型
 */
export interface PreloadResult<T = any> {
  status: PreloadStatus;
  data: T[];
  error?: any;
  updatedAt: number;
}
