// client/adapters/mock-adapter.ts
import type { IClientAdapter } from '../types/client-adapter';

/**
 * 模拟客户端适配器
 * 用于测试和开发环境
 */
export class MockClientAdapter implements IClientAdapter {
  // 内存存储，模拟localStorage
  private storage: Map<string, string> = new Map();

  /**
   * 获取本地存储项
   * @param key 存储键
   * @returns 存储值或null
   */
  public getStorageItem(key: string): string | null {
    console.log('[MockClientAdapter] getStorageItem', key);
    return this.storage.has(key) ? this.storage.get(key)! : null;
  }

  /**
   * 设置本地存储项
   * @param key 存储键
   * @param value 存储值
   * @returns 是否成功
   */
  public setStorageItem(key: string, value: string): boolean {
    console.log('[MockClientAdapter] setStorageItem', key, value);
    this.storage.set(key, value);
    return true;
  }

  /**
   * 移除本地存储项
   * @param key 存储键
   * @returns 是否成功
   */
  public removeStorageItem(key: string): boolean {
    console.log('[MockClientAdapter] removeStorageItem', key);
    this.storage.delete(key);
    return true;
  }

  /**
   * 清空本地存储
   * @returns 是否成功
   */
  public clearStorage(): boolean {
    console.log('[MockClientAdapter] clearStorage');
    this.storage.clear();
    return true;
  }
}