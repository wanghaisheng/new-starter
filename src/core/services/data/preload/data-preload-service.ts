import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import {
  DataPreloadConfig,
  PreloadCacheEntry,
  PreloadStatus,
  PreloadEvent,
  PreloadCallback,
  TablePreloadConfig,
  PreloadResult
} from './types';
import { createNetworkManager, NetworkManager } from '@/core/services/infrastructure/network/network-manager';

// 默认最大缓存表数量
const DEFAULT_MAX_CACHE_TABLES = 20;

export class DataPreloadService {
  private static instance: DataPreloadService;
  private hybrid: HybridDatabaseClient;
  private config: DataPreloadConfig;
  private cache: Map<string, PreloadCacheEntry> = new Map();
  private preloadStatus: Record<string, PreloadStatus> = {};
  private autoPreloadTimer: any = null;
  private eventListeners: Map<PreloadEvent, Set<PreloadCallback>> = new Map();
  private networkManager: NetworkManager;
  private lastNetworkOnline: boolean = true;

  private constructor(hybrid: HybridDatabaseClient, config: DataPreloadConfig) {
    this.hybrid = hybrid;
    this.config = config;
    this.networkManager = createNetworkManager();
    this.lastNetworkOnline = this.networkManager.isConnected();
    this.networkManager.onConnect(() => {
      this.emit('network:online');
      if (this.config.preloadOnNetworkReconnect) {
        this.preloadAll();
      }
      this.lastNetworkOnline = true;
    });
    this.networkManager.onDisconnect(() => {
      this.emit('network:offline');
      this.lastNetworkOnline = false;
    });
    this.setupAutoPreload();
    // 定期检查缓存大小
    setInterval(() => this.checkCacheSize(), 60000); // 每分钟检查一次
  }

  public static getInstance(hybrid: HybridDatabaseClient, config: DataPreloadConfig): DataPreloadService {
    if (!DataPreloadService.instance) {
      DataPreloadService.instance = new DataPreloadService(hybrid, config);
    }
    return DataPreloadService.instance;
  }

  public setConfig(config: Partial<DataPreloadConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupAutoPreload();
  }

  private setupAutoPreload() {
    if (this.autoPreloadTimer) clearInterval(this.autoPreloadTimer);
    if (this.config.enabled && this.config.autoPreloadInterval) {
      this.autoPreloadTimer = setInterval(() => this.preloadAll(), this.config.autoPreloadInterval);
    }
  }

  public on(event: PreloadEvent, callback: PreloadCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  public off(event: PreloadEvent, callback: PreloadCallback) {
    this.eventListeners.get(event)?.delete(callback);
  }
  private emit(event: PreloadEvent, payload?: any) {
    this.eventListeners.get(event)?.forEach(cb => cb(payload));
  }

  public async preloadAll(cb?: (table: string, status: PreloadStatus) => void) {
    if (!this.config.enabled) return;
    // 按优先级和依赖排序
    const tableConfigs = this.getSortedTableConfigs();
    for (const tableConfig of tableConfigs) {
      await this.preloadTable(tableConfig, cb);
    }
  }

  private getSortedTableConfigs(): TablePreloadConfig[] {
    const raw = this.config.preloadTables.map(t =>
      typeof t === 'string' ? { name: t } : t
    );
    // 按 priority 升序，依赖简单处理（可扩展为拓扑排序）
    return raw.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  public async preloadTable(tableConfig: string | TablePreloadConfig, cb?: (table: string, status: PreloadStatus) => void) {
    const cfg = typeof tableConfig === 'string' ? { name: tableConfig } : tableConfig;
    const table = cfg.name;
    this.preloadStatus[table] = 'preloading';
    this.emit('preload:start', { table });
    try {
      const max = cfg.maxRecords || this.config.maxRecordsPerTable || 100;
      const rawResult = await this.hybrid.query(table, { limit: max });
      const dataArray = Array.isArray(rawResult) ? rawResult
        : (rawResult?.rows ?? rawResult?.data ?? []);
      this.cache.set(table, { data: dataArray, timestamp: Date.now() }); // 成功时不写 error 字段
      this.preloadStatus[table] = 'success';
      this.emit('preload:success', { table, data: dataArray });
      cb?.(table, 'success');
    } catch (e) {
      this.cache.set(table, { data: [], timestamp: Date.now(), error: e }); // 失败时写 error 字段
      this.preloadStatus[table] = 'error';
      this.emit('preload:error', { table, error: e });
      cb?.(table, 'error');
    }
  }

  public getCachedData(table: string) {
    const entry = this.cache.get(table);
    if (!entry) return null;
    // 支持 per-table TTL
    const tableCfg = this.getTableConfig(table);
    const ttl = tableCfg?.cacheTTL ?? this.config.cacheTTL;
    if (ttl && Date.now() - entry.timestamp > ttl) {
      this.cache.delete(table);
      this.emit('cache:expired', { table });
      return null;
    }
    return entry.data;
  }

  /**
   * 获取统一的预加载结果
   */
  public getPreloadResult<T = any>(table: string): PreloadResult<T> {
    const entry = this.cache.get(table);
    const status = this.preloadStatus[table] || 'idle';
    return {
      status,
      data: entry?.data ?? [],
      error: entry?.error,
      updatedAt: entry?.timestamp ?? 0,
    };
  }

  /**
   * 检查缓存大小，如果超过限制则清理最旧的数据
   */
  private checkCacheSize(): void {
    const maxTables = this.config.maxCacheTables || DEFAULT_MAX_CACHE_TABLES;
    if (this.cache.size <= maxTables) return;
    // 按时间戳排序，删除最旧的缓存
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    // 删除超出限制的最旧缓存
    const toDelete = entries.slice(0, this.cache.size - maxTables);
    for (const [table] of toDelete) {
      this.cache.delete(table);
      this.emit('cache:expired', { table, reason: 'cache_limit_exceeded' });
    }
  }

  public clearCache(table?: string) {
    if (table) {
      this.cache.delete(table);
    } else {
      this.cache.clear();
    }
  }
  public refreshCache(table: string) {
    const cfg = this.getTableConfig(table);
    if (cfg) this.preloadTable(cfg);
  }

  private getTableConfig(table: string): TablePreloadConfig | undefined {
    return this.config.preloadTables
      .map(t => (typeof t === 'string' ? { name: t } : t))
      .find(cfg => cfg.name === table);
  }

  public getStatus(table: string): PreloadStatus {
    return this.preloadStatus[table] || 'idle';
  }

  // 状态管理扩展点
  public onCacheUpdate(table: string, data: any[]) {
    // 可集成 Redux/MobX/Vuex 等
  }
}
