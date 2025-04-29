import type { IMatchStrategy } from './match-ai-adapter';

export class RandomMatchAdapter implements IMatchStrategy {
  matchUsers(user: any, candidates: any[], opts: any): any[] {
    const limit = opts?.limit || candidates.length;
    // 洗牌算法
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }
}
