import { HybridDatabaseClient } from '../adapters/hybrid-database-client';

export interface TableMigrationConfig {
  name: string;
  mapping?: Record<string, string>;
  filter?: (row: any) => boolean;
  transform?: (row: any) => any;
}

export type MigrationLog = {
  timestamp: number;
  table: string;
  action: string;
  detail?: any;
  status: 'info' | 'error';
};

export type MigrationProgress = {
  table: string;
  total: number;
  migrated: number;
  status: 'pending' | 'migrating' | 'success' | 'error' | 'paused' | 'verifying' | 'retrying' | 'cancelled';
  error?: any;
  batchSize?: number;
  batchIndex?: number;
  isResumable?: boolean;
  verifyPassed?: boolean;
  retryCount?: number;
  cancelled?: boolean;
};

export type GlobalProgress = {
  totalTables: number;
  finishedTables: number;
  totalRows: number;
  migratedRows: number;
  status: 'running' | 'paused' | 'cancelled' | 'success' | 'error';
};

export type MigrationCallback = (progress: MigrationProgress) => void;
export type MigrationLogCallback = (log: MigrationLog) => void;

export interface DataMigrationConfig {
  source: HybridDatabaseClient;
  target: HybridDatabaseClient;
  tables: (string | TableMigrationConfig)[];
  batchSize?: number;
  resumable?: boolean;
  maxRetry?: number;
  verify?: boolean;
  concurrency?: number;
  onLog?: MigrationLogCallback;
  onGlobalProgress?: (progress: GlobalProgress) => void;
  beforeMigration?: () => Promise<void> | void;
  afterMigration?: () => Promise<void> | void;
  beforeBatch?: (table: string, batchIndex: number) => Promise<void> | void;
  afterBatch?: (table: string, batchIndex: number) => Promise<void> | void;
  beforeRow?: (table: string, row: any) => Promise<void> | void;
  afterRow?: (table: string, row: any) => Promise<void> | void;
  onCancel?: () => void;
}

export class DataMigrationService {
  private config: DataMigrationConfig;
  private progress: Record<string, MigrationProgress> = {};
  private paused: boolean = false;
  private cancelled: boolean = false;
  private lastBatchIndex: Record<string, number> = {};
  private retryCount: Record<string, number> = {};
  private logs: MigrationLog[] = [];
  private failedData: Record<string, any[]> = {};

  constructor(config: DataMigrationConfig) {
    this.config = config;
    this.config.tables.forEach(table => {
      const name = typeof table === 'string' ? table : table.name;
      this.progress[name] = { table: name, total: 0, migrated: 0, status: 'pending', isResumable: !!config.resumable, retryCount: 0 };
      this.lastBatchIndex[name] = 0;
      this.retryCount[name] = 0;
      this.failedData[name] = [];
    });
  }

  public pause() {
    this.paused = true;
    this.config.tables.forEach(table => {
      const name = typeof table === 'string' ? table : table.name;
      if (this.progress[name].status === 'migrating') {
        this.progress[name].status = 'paused';
        this.log(name, 'pause', undefined, 'info');
      }
    });
    this.updateGlobalProgress();
  }
  public resume(cb?: MigrationCallback) {
    this.paused = false;
    this.config.tables.forEach(table => {
      const name = typeof table === 'string' ? table : table.name;
      if (this.progress[name].status === 'paused') {
        this.log(name, 'resume', undefined, 'info');
        this.migrateTable(name, cb, true);
      }
    });
    this.updateGlobalProgress();
  }
  public cancel() {
    this.cancelled = true;
    this.paused = false;
    this.config.tables.forEach(table => {
      const name = typeof table === 'string' ? table : table.name;
      this.progress[name].status = 'cancelled';
      this.progress[name].cancelled = true;
      this.log(name, 'cancel', undefined, 'info');
    });
    this.config.onCancel?.();
    this.updateGlobalProgress();
  }

  public async migrateAll(cb?: MigrationCallback) {
    this.cancelled = false;
    this.paused = false;
    await this.config.beforeMigration?.();
    const tableConfigs = this.config.tables.map(t => typeof t === 'string' ? { name: t } : t);
    const concurrency = this.config.concurrency || 1;
    let idx = 0;
    const tasks: Promise<void>[] = [];
    const next = async () => {
      if (idx >= tableConfigs.length) return;
      const tableCfg = tableConfigs[idx++];
      await this.migrateTable(tableCfg.name, cb);
      await next();
    };
    for (let i = 0; i < concurrency; i++) {
      tasks.push(next());
    }
    await Promise.all(tasks);
    await this.config.afterMigration?.();
    this.updateGlobalProgress();
  }

  public async migrateTable(table: string, cb?: MigrationCallback, resumeMode = false) {
    if (this.cancelled) return;
    const tableCfg = this.getTableConfig(table);
    const progress = this.progress[table];
    progress.status = 'migrating';
    cb?.(progress);
    try {
      await this.config.beforeBatch?.(table, this.lastBatchIndex[table]);
      let data = await this.config.source.query(table);
      // 过滤
      if (tableCfg.filter) data = data.filter(tableCfg.filter);
      // 字段映射+转换
      if (tableCfg.mapping || tableCfg.transform) {
        data = data.map(row => {
          let mapped = row;
          if (tableCfg.mapping) {
            mapped = {};
            for (const k in tableCfg.mapping) {
              mapped[tableCfg.mapping[k]] = row[k];
            }
          }
          if (tableCfg.transform) mapped = tableCfg.transform(mapped);
          return mapped;
        });
      }
      progress.total = data.length;
      const batchSize = this.config.batchSize || 50;
      let start = resumeMode ? this.lastBatchIndex[table] * batchSize : 0;
      for (let i = start; i < data.length; i += batchSize) {
        if (this.paused) {
          progress.status = 'paused';
          this.lastBatchIndex[table] = Math.floor(i / batchSize);
          this.log(table, 'pause', { batchIndex: this.lastBatchIndex[table] }, 'info');
          cb?.({ ...progress, batchSize, batchIndex: this.lastBatchIndex[table] });
          this.updateGlobalProgress();
          return;
        }
        if (this.cancelled) {
          progress.status = 'cancelled';
          progress.cancelled = true;
          this.log(table, 'cancel', { batchIndex: Math.floor(i / batchSize) }, 'info');
          cb?.({ ...progress, batchSize, batchIndex: Math.floor(i / batchSize) });
          this.updateGlobalProgress();
          return;
        }
        await this.config.beforeBatch?.(table, Math.floor(i / batchSize));
        const batch = data.slice(i, i + batchSize);
        let batchSuccess = false;
        let batchError;
        let retry = 0;
        do {
          try {
            for (let j = 0; j < batch.length; j++) {
              await this.config.beforeRow?.(table, batch[j]);
              await this.config.target.insert(table, batch[j]);
              await this.config.afterRow?.(table, batch[j]);
              progress.migrated = i + j + 1;
              cb?.({ ...progress, batchSize, batchIndex: Math.floor(i / batchSize) });
              this.updateGlobalProgress();
            }
            batchSuccess = true;
            this.log(table, 'batch', { batchIndex: Math.floor(i / batchSize), count: batch.length }, 'info');
          } catch (err) {
            batchError = err;
            retry++;
            this.retryCount[table] = retry;
            progress.status = 'retrying';
            progress.retryCount = retry;
            this.failedData[table].push(...batch);
            this.log(table, 'batch-retry', { batchIndex: Math.floor(i / batchSize), error: err, retry }, 'error');
            cb?.({ ...progress, batchSize, batchIndex: Math.floor(i / batchSize), error: err });
            this.updateGlobalProgress();
            if (this.config.maxRetry && retry >= this.config.maxRetry) {
              throw err;
            }
          }
        } while (!batchSuccess && (!this.config.maxRetry || retry < this.config.maxRetry));
        if (!batchSuccess) throw batchError;
        await this.config.afterBatch?.(table, Math.floor(i / batchSize));
      }
      if (this.config.verify) {
        progress.status = 'verifying';
        cb?.({ ...progress });
        let src = await this.config.source.query(table);
        let tgt = await this.config.target.query(table);
        if (tableCfg.filter) src = src.filter(tableCfg.filter);
        if (tableCfg.mapping || tableCfg.transform) {
          src = src.map(row => {
            let mapped = row;
            if (tableCfg.mapping) {
              mapped = {};
              for (const k in tableCfg.mapping) {
                mapped[tableCfg.mapping[k]] = row[k];
              }
            }
            if (tableCfg.transform) mapped = tableCfg.transform(mapped);
            return mapped;
          });
        }
        progress.verifyPassed = src.length === tgt.length;
        this.log(table, 'verify', { src: src.length, tgt: tgt.length, passed: progress.verifyPassed }, progress.verifyPassed ? 'info' : 'error');
      }
      progress.status = 'success';
      cb?.({ ...progress, batchSize, batchIndex: Math.ceil(data.length / batchSize) });
      this.lastBatchIndex[table] = 0;
      this.retryCount[table] = 0;
      this.updateGlobalProgress();
    } catch (e) {
      progress.status = 'error';
      progress.error = e;
      this.log(table, 'error', e, 'error');
      cb?.({ ...progress });
      this.updateGlobalProgress();
    }
  }

  public getProgress(table: string): MigrationProgress {
    return this.progress[table];
  }

  public getGlobalProgress(): GlobalProgress {
    const totalTables = this.config.tables.length;
    let finishedTables = 0, totalRows = 0, migratedRows = 0, status: GlobalProgress['status'] = 'running';
    for (const t of this.config.tables) {
      const name = typeof t === 'string' ? t : t.name;
      const prog = this.progress[name];
      totalRows += prog.total;
      migratedRows += prog.migrated;
      if (prog.status === 'success') finishedTables++;
      if (prog.status === 'error') status = 'error';
      if (prog.status === 'paused') status = 'paused';
      if (prog.status === 'cancelled') status = 'cancelled';
    }
    if (finishedTables === totalTables) status = 'success';
    return { totalTables, finishedTables, totalRows, migratedRows, status };
  }

  public getLogs(): MigrationLog[] {
    return this.logs;
  }
  public getFailedData(table: string): any[] {
    return this.failedData[table];
  }

  private log(table: string, action: string, detail: any, status: 'info' | 'error') {
    const entry: MigrationLog = {
      timestamp: Date.now(),
      table,
      action,
      detail,
      status
    };
    this.logs.push(entry);
    this.config.onLog?.(entry);
  }
  private getTableConfig(table: string): TableMigrationConfig {
    const found = this.config.tables.find(t => (typeof t === 'string' ? t === table : t.name === table));
    return typeof found === 'string' ? { name: found } : found!;
  }
  private updateGlobalProgress() {
    this.config.onGlobalProgress?.(this.getGlobalProgress());
  }
}
