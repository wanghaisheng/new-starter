import { MatchRepository } from '@/core/lib/db/repositories/impl/match-repository';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match.types';
import { User } from '@/core/lib/db/types/user.types';
import { IDataService } from '@/core/services/data/types';
import type { IMatchStrategy } from '@/core/services/business/match/ai-adapters/match-ai-adapter';
import { CompositeMatchAdapter } from '@/core/services/business/match/ai-adapters/composite-match-adapter';
import { UserService } from '@/core/services/business/user/user-service';
import type { MatchPreference } from '@/core/lib/db/types/match-preference.types';
import { createDynamicCompositeAdapter } from '@/core/services/business/match/ai-adapters/dynamic-strategy';
import { getEnhancers } from './enhancers';

/**
 * 类型安全 MatchService（新架构）
 * 所有数据访问通过 MatchRepository，确保类型安全。
 */
export interface UserBaseFilter {
  gender?: 'male' | 'female' | 'other';
  minAge?: number;
  maxAge?: number;
  region?: string;
  activeOnly?: boolean;
  [key: string]: any; // 允许扩展
}

export interface MatchUsersOptions {
  maxDistanceKm?: number;
  includeTags?: string[];
  excludeTags?: string[];
  useRandom?: boolean;
  useBazi?: boolean;
  useMBTI?: boolean;
  mbtiType?: string;
  limit?: number;
  /**
   * 可选：基础过滤条件，透传给 getRecommendedUsers
   */
  baseFilter?: UserBaseFilter;
}

export interface MatchOptions extends Partial<MatchPreference> {
  // 可扩展临时参数，如本次匹配特有的过滤条件等
}

export class MatchService {
  private matchRepo: MatchRepository;
  private aiAdapter: IMatchStrategy;
  private userService: UserService;
  private configService: any; // 系统级配置服务
  private settingService: any; // 用户级配置服务（如有）

  /**
   * @param configService 系统级配置服务，决定本系统支持哪些匹配算法（如 'location', 'tag', 'mbti' 等）
   * @param settingService 用户级配置服务（如有）
   */
  constructor(dataService: IDataService, configService: any, userService?: UserService, settingService?: any) {
    this.matchRepo = new MatchRepository(dataService);
    this.configService = configService;
    this.settingService = settingService;
    this.userService = userService!;
    // 默认初始化，实际匹配时可动态调整
    this.aiAdapter = createDynamicCompositeAdapter(this.configService, null, null);
  }

  /**
   * quiz 结果联动入口
   */
  async onQuizResult(userId: string, tags: string[], report: any): Promise<void> {
    // 这里可根据业务需要刷新标签、触发推荐等
    await this.refreshUserMatches(userId);
  }

  /**
   * 根据最新标签/画像刷新推荐池
   */
  async refreshUserMatches(userId: string): Promise<void> {
    // 示例：可触发重新计算推荐池逻辑
    // 这里只做占位，具体实现需结合业务
    return Promise.resolve();
  }

  /**
   * 获取用户所有匹配记录
   */
  async getUserMatches(userId: string): Promise<Match[]> {
    return this.matchRepo.findByUserId(userId);
  }

  /**
   * 获取已匹配用户
   */
  async getMatchedUsers(userId: string): Promise<User[]> {
    const matches = await this.matchRepo.findByUserId(userId);
    const otherUserIds = matches.flatMap(m => [m.userAId, m.userBId]).filter(id => id !== userId);
    const { items } = await this.userService.getUsersByIds([...new Set(otherUserIds)]);
    return items;
  }

  /**
   * 查询两用户匹配状态
   */
  async getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'> {
    const matches = await this.matchRepo.findByUserId(userId);
    const matched = matches.some(match => match.userAId === targetUserId || match.userBId === targetUserId);
    return matched ? 'matched' : 'none'; // 可扩展 pending 状态
  }

  /**
   * 综合多机制智能匹配（主入口）
   * 支持根据用户偏好和临时选项动态调整算法顺序和内容
   */
  async matchUsers(userId: string, options?: MatchOptions, preference?: MatchPreference): Promise<User[]> {
    let mergedPreference: MatchPreference = { ...(preference || {}) };
    if (options) {
      mergedPreference = { ...mergedPreference, ...options };
    }
    const candidates = await this.matchRepo.getRecommendedUsers(userId, mergedPreference.baseFilter);
    const user = await this.userService.getUserById(userId);
    if (!user) throw new Error('User not found');
    const matchPreference = (options as any)?.matchPreference || (await this.settingService?.getMatchPreference?.(user.id));
    const tempOpts = (options as any)?.tempOpts || {};
    const aiAdapter = createDynamicCompositeAdapter(this.configService, matchPreference, tempOpts);
    let result = aiAdapter.matchUsers(user, candidates, options);
    // 动态组合增强器处理
    const enhancerList = this.configService?.matchEnhancerList || ['deduplicate', 'sort'];
    const enhancers = getEnhancers(enhancerList);
    let context = { ...options, ...matchPreference, ...tempOpts };
    for (const enhancer of enhancers) {
      // 支持异步增强器
      if (typeof enhancer.enhance === 'function') {
        result = await enhancer.enhance(result, context);
      }
    }
    return result;
  }

  /**
   * 获取用户所有相关的历史匹配对象（含已过期/已解除/所有历史）
   */
  async getUserMatchHistory(userId: string): Promise<User[]> {
    const matches = await this.matchRepo.findByUserId(userId);
    const allUserIds = Array.from(new Set(
      matches.flatMap(match => [match.userAId, match.userBId]).filter(id => id !== userId)
    ));
    const { items } = await this.userService.getUsersByIds(allUserIds);
    return items.filter(Boolean);
  }

  /**
   * 创建匹配
   */
  async createMatch(data: CreateMatchData): Promise<Match> {
    return this.matchRepo.createMatch(data);
  }

  /**
   * 更新匹配
   */
  async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match | null> {
    return this.matchRepo.updateMatch(matchId, data);
  }

  /**
   * 删除匹配
   */
  async deleteMatch(matchId: string): Promise<boolean> {
    return this.matchRepo.delete(matchId);
  }

  /**
   * 判断两个用户是否已匹配
   */
  async isMatchedWith(userId: string, targetUserId: string): Promise<boolean> {
    const matches = await this.matchRepo.findByUserId(userId);
    return matches.some(match => match.userAId === targetUserId || match.userBId === targetUserId);
  }
}
