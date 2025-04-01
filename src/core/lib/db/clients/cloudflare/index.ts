/**
 * Cloudflare D1 数据库客户端模块
 * 
 * 该模块导出 CloudflareD1Client 和相关类型，用于访问 Cloudflare D1 数据库。
 * 
 * @module CloudflareD1Client
 */

export { CloudflareD1Client } from './cloudflare-d1-client';
export type { 
  CloudflareD1Config, 
  D1Database, 
  D1PreparedStatement, 
  D1Result, 
  D1ExecResult 
} from './cloudflare-d1-config'; 