// config-adapter.types.ts
export interface IConfigAdapter {
  initialize(): Promise<void>;
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, value: T): void;
  has(key: string): boolean;
  remove(key: string): void;
}
