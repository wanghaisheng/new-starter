import { User } from '@/core/lib/db/types/user.types';

/**
 * 匹配算法适配器接口：统一地理、标签、八字、MBTI等算法入口
 */
export interface IMatchAIAdapter {
  /** 地理位置筛选 */
  matchByLocation(user: User, candidates: User[], maxDistanceKm: number): User[];
  /** 标签/兴趣/MBTI筛选 */
  matchByTags(user: User, candidates: User[], includeTags?: string[], excludeTags?: string[]): User[];
  /** 八字命理匹配加分 */
  baziMatchFull(userAProfile: any, userBProfile: any, options?: { genderA?: '男'|'女', genderB?: '男'|'女', weights?: Record<string, number> }): number;
  /** 八字简化匹配 */
  baziMatchDetailed(userAProfile: any, userBProfile: any, options?: { genderA?: '男'|'女', genderB?: '男'|'女', weights?: Record<string, number> }): number;
  /** MBTI 匹配算法 */
  mbtiMatch(userAMBTI: string, userBMBTI: string): number;
  /** 随机匹配（兜底） */
  matchRandom(candidates: User[], limit?: number): User[];
  /** 手机品牌筛选/加分 */
  matchByPhoneBrand(user: User, candidates: User[], targetBrands?: string[]): User[];
  /** 城市地理位置筛选 */
  matchByCity(user: User, candidates: User[], targetCities?: string[]): User[];
  /**
   * 综合多机制智能匹配
   * @param user 当前用户
   * @param candidates 候选池
   * @param opts 可选的多机制筛选参数
   * 支持：位置、兴趣、mbti、八字、随机等任意组合
   */
  matchUsers(user: User, candidates: User[], opts: {
    maxDistanceKm?: number;
    includeTags?: string[];
    excludeTags?: string[];
    useRandom?: boolean;
    useBazi?: boolean;
    useMBTI?: boolean;
    mbtiType?: string;
    limit?: number;
    /** 新增：手机品牌筛选 */
    phoneBrands?: string[];
    /** 新增：城市筛选 */
    cities?: string[];
  }): User[];
}
