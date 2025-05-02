// client/adapters/default-adapter.ts
import type { IClientAdapter } from '../types/client-adapter';

/**
 * 默认客户端适配器
 * 提供基本的客户端服务实现
 */
export class DefaultClientAdapter implements IClientAdapter {
  /**
   * 获取本地存储项
   * @param key 存储键
   * @returns 存储值或null
   */
  public getStorageItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('[DefaultClientAdapter] localStorage not available', e);
      return null;
    }
  }

  /**
   * 设置本地存储项
   * @param key 存储键
   * @param value 存储值
   * @returns 是否成功
   */
  public setStorageItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('[DefaultClientAdapter] localStorage not available', e);
      return false;
    }
  }

  /**
   * 移除本地存储项
   * @param key 存储键
   * @returns 是否成功
   */
  public removeStorageItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('[DefaultClientAdapter] localStorage not available', e);
      return false;
    }
  }

  /**
   * 清空本地存储
   * @returns 是否成功
   */
  public clearStorage(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('[DefaultClientAdapter] localStorage not available', e);
      return false;
    }
  }
}