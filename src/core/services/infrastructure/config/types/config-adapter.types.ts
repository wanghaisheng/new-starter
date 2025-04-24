// config-adapter.ts
export interface IConfigAdapter {
  initialize(): Promise<void>;
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, value: T): void;
  has(key: string): boolean;
  remove(key: string): void;
  /**
   * 可选：运行时刷新配置（如远程配置中心、动态热更新）
   */
  refresh?(): Promise<void>;
}
