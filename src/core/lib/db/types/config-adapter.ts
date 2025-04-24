// 配置适配器接口定义
/**
 * IConfigAdapter
 * 通用配置适配器接口，支持异步获取、设置、检测和移除配置项
 */
export interface IConfigAdapter {
  /**
   * 获取配置项
   * @param key 配置项 key
   */
  get<T = any>(key: string): Promise<T | undefined>;
  /**
   * 设置配置项
   * @param key 配置项 key
   * @param value 配置项值
   */
  set<T = any>(key: string, value: T): Promise<void>;
  /**
   * 检查配置项是否存在
   * @param key 配置项 key
   */
  has(key: string): boolean;
  /**
   * 移除配置项
   * @param key 配置项 key
   */
  remove(key: string): void;
}
