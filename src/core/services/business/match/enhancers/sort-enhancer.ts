import type { User } from '@/core/lib/db/types/user.types';

export interface IMatchEnhancer {
  enhance(candidates: User[], context?: any): Promise<User[]>;
}

/**
 * 排序增强器：根据 context 中的排序规则对候选池排序
 */
export class SortEnhancer implements IMatchEnhancer {
  async enhance(candidates: User[], context?: any): Promise<User[]> {
    if (!context?.sortBy) return candidates;
    const { sortBy, order = 'asc' } = context;
    return candidates.slice().sort((a, b) => {
      if (a[sortBy] === b[sortBy]) return 0;
      if (order === 'asc') return a[sortBy] > b[sortBy] ? 1 : -1;
      return a[sortBy] < b[sortBy] ? 1 : -1;
    });
  }
}