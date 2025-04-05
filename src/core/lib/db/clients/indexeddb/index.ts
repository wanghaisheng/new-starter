/**
 * IndexedDB 数据库客户端模块
 * 
 * 此模块导出 IndexedDBClient 及其相关类型，提供对 IndexedDB 数据库的访问
 */

export { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
export type { IndexedDBConfig } from '@/core/lib/db/clients/indexeddb/indexeddb-client'; 

/**
 * 测试工具 - 模拟 IndexedDB
 * 仅用于测试目的，不建议在生产环境使用
 */
export * from '@/core/lib/db/clients/indexeddb/fake-indexeddb'; 