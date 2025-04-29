import { BaseClient } from '@/core/lib/db/clients/base-client';

export interface IDataInitializerAdapter {
  /**
   * 初始化数据库结构和/或默认数据
   * @param options
   *   mode: 'structure'（仅建表） | 'full'（结构+默认数据）
   *   tables?: string[]  // 指定表名，未指定则全量
   *   reset?: boolean    // true=重置表，false=增量导入
   */
  initialize(options?: {
    mode?: 'structure' | 'full';
    tables?: string[];
    reset?: boolean;
  }): Promise<void>;
  getClient(): BaseClient;
}
