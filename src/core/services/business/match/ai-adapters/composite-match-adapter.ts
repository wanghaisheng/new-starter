import { User } from '@/core/lib/db/types/user.types';
import type { IMatchStrategy } from './match-ai-adapter';

export class CompositeMatchAdapter implements IMatchStrategy {
  constructor(private adapters: IMatchStrategy[]) {}

  /**
   * 组合匹配主入口：依次应用所有策略，最后如 opts.useRandom 或 candidates 数量不足时自动兜底
   */
  matchUsers(user: any, candidates: any[], opts: any): any[] {
    let pool = candidates;
    for (const adapter of this.adapters) {
      // 跳过 RandomMatchAdapter，兜底时再用
      if (adapter.constructor.name === 'RandomMatchAdapter') continue;
      pool = adapter.matchUsers(user, pool, opts);
    }
    // 若 pool 为空或 opts.useRandom，兜底随机
    const randomAdapter = this.adapters.find(a => a.constructor.name === 'RandomMatchAdapter');
    if ((opts?.useRandom || pool.length === 0) && randomAdapter) {
      return randomAdapter.matchUsers(user, candidates, opts);
    }
    return pool;
  }
}
