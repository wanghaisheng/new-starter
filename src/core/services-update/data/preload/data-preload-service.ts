import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import {
  DataPreloadConfig,
  PreloadCacheEntry,
  PreloadStatus,
  PreloadEvent,
  PreloadCallback,
  TablePreloadConfig
} from './types';
import { NetworkService } from '../../infrastructure/providers/network/network-service';

export class DataPreloadService {
  private static instance: DataPreloadService;
  private hybrid: HybridDatabaseClient;
  private config: DataPreloadConfig;
  private cache: Map<string, PreloadCacheEntry> = new Map();
  private preloadStatus: Record<string, PreloadStatus> = {};
  private autoPreloadTimer: any = null;
  private eventListeners: Map<PreloadEvent, Set<PreloadCallback>> = new Map();
  private networkService: NetworkService;
  private lastNetworkOnline: boolean = true;

  private constructor(hybrid: HybridDatabaseClient, config: DataPreloadConfig) {
    this.hybrid = hybrid;
    this.config = config;
    this.networkService = NetworkService.getInstance();
    this.setupNetworkListener();
    this.setupAutoPreload();
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

  private setupNetworkListener() {
    // 假设 networkService 提供 addNetworkStatusListener(callback: (online: boolean) => void)
    this.networkService.addNetworkStatusListener((online: boolean) => {
      if (online && !this.lastNetworkOnline) {
        this.emit('network:online');
        if (this.config.preloadOnNetworkReconnect) {
          this.preloadAll();
        }
      }
      if (!online && this.lastNetworkOnline) {
        this.emit('network:offline');
      }
      this.lastNetworkOnline = online;
    });
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
      const data = await this.hybrid.query(table, { limit: max });
      this.cache.set(table, { data, timestamp: Date.now() });
      this.preloadStatus[table] = 'success';
      this.emit('preload:success', { table, data });
      cb?.(table, 'success');
    } catch (e) {
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
