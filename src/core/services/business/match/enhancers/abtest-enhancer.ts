import type { User } from '@/core/lib/db/types/user.types';
import type { IMatchEnhancer } from './sort-enhancer';

/**
 * A/B 测试增强器：根据 context.abTestGroup 分流候选池
 */
export class AbTestEnhancer implements IMatchEnhancer {
  async enhance(candidates: User[], context?: any): Promise<User[]> {
    if (!context?.abTestGroup) return candidates;
    // 简单分流示例：按 abTestGroup 取模分组
    const group = context.abTestGroup;
    return candidates.filter(user => {
      // 假设 user.id 可用于分组
      const hash = [...user.id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return hash % 2 === (group === 'A' ? 0 : 1);
    });
  }
}