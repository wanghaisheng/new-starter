import type { IMatchStrategy } from './match-ai-adapter';

export class LocationMatchAdapter implements IMatchStrategy {
  matchUsers(user: any, candidates: any[], opts: any): any[] {
    if (!opts.maxDistanceKm || !user?.location) return candidates;
    return candidates.filter((u: any) => {
      if (!u.location) return false;
      const dist = this.calcDistance(user.location, u.location);
      return dist <= opts.maxDistanceKm;
    });
  }

  /** 地理位置筛选 */
  matchByLocation(user: any, candidates: any[], opts: any): any[] {
    if (!user?.location || !opts?.maxDistanceKm) return [];
    return candidates.filter((u: any) => {
      if (!u.location) return false;
      const dist = this.calcDistance(user.location, u.location);
      return dist <= opts.maxDistanceKm;
    });
  }

  /** 计算两地距离（单位：km） */
  private calcDistance(loc1: any, loc2: any): number {
    // 简化版地理距离计算
    return Math.sqrt(Math.pow(loc1.lat - loc2.lat, 2) + Math.pow(loc1.lng - loc2.lng, 2));
  }
}
