import { randomBytes } from 'crypto';

/**
 * 生成一个随机的 token
 * @param length token 长度，默认为 32
 * @returns 生成的 token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
} 