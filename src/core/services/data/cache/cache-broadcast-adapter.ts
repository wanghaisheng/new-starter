// 多端缓存一致性广播适配器
import type { CacheUpdateEvent } from '@/core/services/data/types';

export interface ICacheBroadcastAdapter {
  onMessage(cb: (event: CacheUpdateEvent) => void): () => void;
  broadcast(event: CacheUpdateEvent): void;
  close(): void;
}

// 浏览器端实现：BroadcastChannel 优先，降级 localStorage
export class WebBroadcastChannelAdapter implements ICacheBroadcastAdapter {
  private channel?: BroadcastChannel;
  private listeners: Array<(event: CacheUpdateEvent) => void> = [];
  constructor(channelName = 'cache-sync') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(channelName);
    }
  }
  onMessage(cb: (event: CacheUpdateEvent) => void): () => void {
    if (this.channel) {
      const handler = (e: MessageEvent) => cb(e.data);
      this.channel.addEventListener('message', handler);
      return () => this.channel?.removeEventListener('message', handler);
    } else if (typeof window !== 'undefined' && window.addEventListener) {
      const listener = (e: StorageEvent) => {
        if (e.key === 'cache-update' && e.newValue) {
          try { cb(JSON.parse(e.newValue)); } catch {}
        }
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    }
    return () => {};
  }
  broadcast(event: CacheUpdateEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('cache-update', JSON.stringify(event));
    }
  }
  close() {
    this.channel?.close();
    this.listeners = [];
  }
}

// Node 端示例：进程间通信
export class NodeProcessBroadcastAdapter implements ICacheBroadcastAdapter {
  private listeners: Array<(event: CacheUpdateEvent) => void> = [];
  onMessage(cb: (event: CacheUpdateEvent) => void): () => void {
    const handler = cb as any;
    process.on('message', handler);
    this.listeners.push(cb);
    return () => process.off('message', handler);
  }
  broadcast(event: CacheUpdateEvent) {
    if (process.send) process.send(event);
  }
  close() {
    this.listeners = [];
  }
}

// 工厂方法：自动选择最佳适配器
export function getBestCacheBroadcastAdapter(): ICacheBroadcastAdapter {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new WebBroadcastChannelAdapter();
  }
  if (typeof process !== 'undefined' && process.send) {
    return new NodeProcessBroadcastAdapter();
  }
  // 可扩展 Redis、Socket、其它
  return new WebBroadcastChannelAdapter(); // 默认兜底
}
