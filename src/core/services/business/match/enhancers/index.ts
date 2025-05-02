import { SortEnhancer } from './sort-enhancer';
import { DeduplicateEnhancer } from './deduplicate-enhancer';
import { AbTestEnhancer } from './abtest-enhancer';
import type { IMatchEnhancer } from './sort-enhancer';

export const enhancerRegistry: Record<string, IMatchEnhancer> = {
  sort: new SortEnhancer(),
  deduplicate: new DeduplicateEnhancer(),
  abtest: new AbTestEnhancer(),
};

export function getEnhancers(list: string[]): IMatchEnhancer[] {
  return list.map(key => enhancerRegistry[key]).filter(Boolean);
}