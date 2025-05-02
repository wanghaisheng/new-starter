// client/types/client-adapter.ts

/**
 * 客户端适配器接口
 * 定义所有客户端服务需要实现的方法
 */
export interface IClientAdapter {
  /**
   * 获取本地存储项
   * @param key 存储键
   * @returns 存储值或null
   */
  getStorageItem(key: string): string | null;

  /**
   * 设置本地存储项
   * @param key 存储键
   * @param value 存储值
   * @returns 是否成功
   */
  setStorageItem(key: string, value: string): boolean;
  
  /**
   * 移除本地存储项
   * @param key 存储键
   * @returns 是否成功
   */
  removeStorageItem(key: string): boolean;

  /**
   * 清空本地存储
   * @returns 是否成功
   */
  clearStorage(): boolean;

  // 可以添加更多客户端服务方法
  // 如：文件操作、传感器访问、通知等
}