import type { IMatchStrategy } from './match-ai-adapter';

export class TagMatchAdapter implements IMatchStrategy {
  matchUsers(user: any, candidates: any[], opts: any): any[] {
    const { includeTags, excludeTags } = opts;
    let result = candidates;
    if (includeTags && includeTags.length > 0) {
      result = result.filter((u: any) => includeTags.some((tag: string) => (u.interests || []).includes(tag)));
    }
    if (excludeTags && excludeTags.length > 0) {
      result = result.filter((u: any) => !excludeTags.some((tag: string) => (u.interests || []).includes(tag)));
    }
    return result;
  }

  /** 手机品牌筛选/加分 */
  matchByPhoneBrand(user: any, candidates: any[], opts: any): any[] {
    const targetBrands = opts?.phoneBrands;
    if (!targetBrands || targetBrands.length === 0) return candidates;
    return candidates.filter((u: any) => u.phoneBrand && targetBrands.includes(u.phoneBrand));
  }

  /** 城市地理位置筛选 */
  matchByCity(user: any, candidates: any[], opts: any): any[] {
    const targetCities = opts?.cities;
    if (!targetCities || targetCities.length === 0) return candidates;
    return candidates.filter((u: any) => u.city && targetCities.includes(u.city));
  }

  /** 标签/兴趣/MBTI筛选 */
  matchByTags(user: any, candidates: any[], opts: any): any[] {
    const { includeTags, excludeTags } = opts;
    let result = candidates;
    if (includeTags && includeTags.length > 0) {
      result = result.filter((u: any) => includeTags.some((tag: string) => (u.interests || []).includes(tag)));
    }
    if (excludeTags && excludeTags.length > 0) {
      result = result.filter((u: any) => !excludeTags.some((tag: string) => (u.interests || []).includes(tag)));
    }
    return result;
  }
}
