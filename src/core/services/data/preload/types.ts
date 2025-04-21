export type PreloadEvent =
  | 'preload:start'
  | 'preload:success'
  | 'preload:error'
  | 'cache:expired'
  | 'network:online'
  | 'network:offline';

export type PreloadCallback = (payload?: any) => void;

export interface TablePreloadConfig {
  name: string;
  maxRecords?: number;
  cacheTTL?: number;
  priority?: number;
  dependsOn?: string[];
}

export interface DataPreloadConfig {
  enabled?: boolean;
  preloadTables: (string | TablePreloadConfig)[];
  maxRecordsPerTable?: number;
  autoPreloadInterval?: number; // ms
  cacheTTL?: number; // ms
  cacheKeyPrefix?: string;
  preloadOnNetworkReconnect?: boolean;
}

export interface PreloadCacheEntry<T = any> {
  data: T[];
  timestamp: number;
}

export type PreloadStatus = 'idle' | 'preloading' | 'success' | 'error';
