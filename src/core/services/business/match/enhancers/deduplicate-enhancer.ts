import type { User } from '@/core/lib/db/types/user.types';
import type { IMatchEnhancer } from './sort-enhancer';

/**
 * 去重增强器：根据用户唯一标识去重
 */
export class DeduplicateEnhancer implements IMatchEnhancer {
  async enhance(candidates: User[], context?: any): Promise<User[]> {
    const seen = new Set<string>();
    return candidates.filter(user => {
      if (seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
  }
}