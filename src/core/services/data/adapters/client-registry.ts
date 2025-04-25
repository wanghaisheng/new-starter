// src/core/services/data/adapters/client-registry.ts

import { DbProvider, DbOrm } from '@/core/lib/db/types/common';

/**
 * 数据库 Client 注册表：支持 provider + orm 组合的底层 client 插件注册与获取。
 * 适用于聚合型/复合型适配器、工厂、测试等场景。
 */
export type ClientConstructor = new (...args: any[]) => any;

class ClientRegistry {
  private static registry = new Map<string, ClientConstructor>();

  static register(provider: DbProvider | string, orm: DbOrm | string, ctor: ClientConstructor) {
    const key = `${provider}:${orm}`;
    this.registry.set(key, ctor);
  }

  static get(provider: DbProvider | string, orm: DbOrm | string): ClientConstructor | undefined {
    return this.registry.get(`${provider}:${orm}`);
  }

  static all() {
    return Array.from(this.registry.entries());
  }
}

export { ClientRegistry };
