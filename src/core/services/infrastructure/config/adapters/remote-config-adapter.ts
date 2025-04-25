import { IConfigAdapter } from '../types/config-adapter';
import { configEventBus } from '../events/config-events';
import { CONFIG_KEYS } from '../config-keys';

/**
 * 支持远程推送和热更新的 RemoteConfigAdapter
 * - 初始化时拉取远程配置
 * - 支持定时轮询/长连接推送（WebSocket/SSE）
 * - 配置变更后自动通过 configEventBus.emit 通知全局
 */
export class RemoteConfigAdapter implements IConfigAdapter {
  private store: Record<string, any> = {};
  private pollingTimer: any = null;
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private wsUrl: string;
  private sseUrl: string;

  constructor() {
    // 从环境变量读取 ws/sse 地址，支持前后端同构
    this.wsUrl =
      typeof process !== 'undefined' && process.env && process.env[CONFIG_KEYS.NEXT_PUBLIC_CONFIG_WS_URL]
        ? process.env[CONFIG_KEYS.NEXT_PUBLIC_CONFIG_WS_URL]
        : (typeof window !== 'undefined' && (window as any)[CONFIG_KEYS.NEXT_PUBLIC_CONFIG_WS_URL]) || '';
    this.sseUrl =
      typeof process !== 'undefined' && process.env && process.env[CONFIG_KEYS.NEXT_PUBLIC_CONFIG_SSE_URL]
        ? process.env[CONFIG_KEYS.NEXT_PUBLIC_CONFIG_SSE_URL]
        : (typeof window !== 'undefined' && (window as any)[CONFIG_KEYS.NEXT_PUBLIC_CONFIG_SSE_URL]) || '';
  }

  async initialize() {
    await this.fetchAndUpdate();
    this.startPolling(); // 定时轮询远程配置
    this.startWebSocket(); // WebSocket 实时推送
    this.startSSE(); // SSE 实时推送
  }

  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) {
    const oldValue = this.store[key];
    this.store[key] = value;
    if (oldValue !== value) configEventBus.emit(key, value);
  }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) {
    delete this.store[key];
    configEventBus.emit(key, undefined);
  }

  async refresh(key?: string): Promise<void> {
    // 支持全量或单 key 刷新（如后端支持，可扩展单 key 拉取）
    await this.fetchAndUpdate();
  }

  /**
   * 拉取远程配置并更新本地 store，自动 emit 变更
   * 生产环境建议对接 Consul、Apollo、Spring Cloud Config 等配置中心
   */
  private async fetchAndUpdate() {
    const { NEXT_PUBLIC_CONFIG_CONSUL_URL } = CONFIG_KEYS;
    const consulUrl =
      (typeof process !== 'undefined' && process.env && process.env[NEXT_PUBLIC_CONFIG_CONSUL_URL]) ||
      (typeof window !== 'undefined' && (window as any)[NEXT_PUBLIC_CONFIG_CONSUL_URL]) ||
      'http://localhost:8500';
    try {
      // 实际生产环境应替换为真实远程 API 请求
      const response = await fetch(`${consulUrl}/v1/kv/your-app/config?raw`);
      if (!response.ok) throw new Error('远程配置拉取失败');
      const remoteConfig = await response.json();
      for (const key in remoteConfig) {
        if (!(key in CONFIG_KEYS)) {
          // eslint-disable-next-line no-console
          console.warn(`[RemoteConfigAdapter] 远程下发的 key '${key}' 不在 CONFIG_KEYS 中，请补充 config-keys.ts 保证类型安全！`);
        }
        const oldValue = this.store[key];
        this.store[key] = remoteConfig[key];
        if (oldValue !== remoteConfig[key]) {
          configEventBus.emit(key, remoteConfig[key]);
        }
      }
    } catch (e) {
      console.warn('[RemoteConfigAdapter] 拉取配置中心异常', e);
    }
  }

  /**
   * 定时轮询远程配置，实现热更新
   */
  private startPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = setInterval(() => {
      this.fetchAndUpdate();
    }, 10_000); // 每 10 秒轮询，可调整
  }

  /**
   * WebSocket 实时推送配置变更（需后端支持）
   */
  private startWebSocket() {
    if (!this.wsUrl) return;
    try {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data === 'object') {
            for (const key in data) {
              if (!(key in CONFIG_KEYS)) {
                // eslint-disable-next-line no-console
                console.warn(`[RemoteConfigAdapter] WebSocket 推送的 key '${key}' 不在 CONFIG_KEYS 中，请补充 config-keys.ts 保证类型安全！`);
              }
              const oldValue = this.store[key];
              this.store[key] = data[key];
              if (oldValue !== data[key]) {
                configEventBus.emit(key, data[key]);
              }
            }
          }
        } catch (e) { /* 忽略解析异常 */ }
      };
      this.ws.onerror = () => {/* 可加重连逻辑 */};
    } catch (e) {/* 忽略 ws 不可用场景 */}
  }

  /**
   * SSE (Server-Sent Events) 实时推送配置变更（需后端支持）
   */
  private startSSE() {
    if (!this.sseUrl) return;
    try {
      this.sse = new EventSource(this.sseUrl);
      this.sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data === 'object') {
            for (const key in data) {
              if (!(key in CONFIG_KEYS)) {
                // eslint-disable-next-line no-console
                console.warn(`[RemoteConfigAdapter] SSE 推送的 key '${key}' 不在 CONFIG_KEYS 中，请补充 config-keys.ts 保证类型安全！`);
              }
              const oldValue = this.store[key];
              this.store[key] = data[key];
              if (oldValue !== data[key]) {
                configEventBus.emit(key, data[key]);
              }
            }
          }
        } catch (e) { /* 忽略解析异常 */ }
      };
      this.sse.onerror = () => {/* 可加重连逻辑 */};
    } catch (e) {/* 忽略 sse 不可用场景 */}
  }
}
