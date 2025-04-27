import { MatchRepository } from '@/core/lib/db/repositories/impl/match-repository';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match.types';
import { User } from '@/core/lib/db/types/user.types';
import { IDataService } from '@/core/services/data/types';
import { IMatchAIAdapter } from '@/core/services/business/match/ai-adapters/match-ai-adapter';
import { DefaultMatchAIAdapter } from '@/core/services/business/match/ai-adapters/default-match-ai-adapter';
import { UserService } from '@/core/services/business/user/user-service';

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

export class MatchService {
  private matchRepo: MatchRepository;
  private aiAdapter: IMatchAIAdapter;
  private userService: UserService;

  constructor(dataService: IDataService, aiAdapter?: IMatchAIAdapter, userService?: UserService) {
    this.matchRepo = new MatchRepository(dataService);
    this.aiAdapter = aiAdapter || new DefaultMatchAIAdapter();
    this.userService = userService!;
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
   * 综合多机制智能匹配
   * @param userId 当前用户ID
   * @param opts 组合算法参数，支持地理、标签、MBTI、八字、随机等
   * @returns 推荐用户列表，已按算法策略排序和裁剪
   *
   * 推荐扩展方式：
   * - 业务层可根据用户类型/每日推荐数动态设置 opts.limit
   * - 新增算法只需扩展 aiAdapter 和 opts 参数，无需修改业务层
   */
  async matchUsers(userId: string, opts: MatchUsersOptions): Promise<User[]> {
    const user = await this.userService.getUserById(userId);
    if (!user) return [];
    // 可根据用户类型/每日推荐数动态设置 limit
    // 例如：opts.limit = user.isVip ? 50 : 10;
    const { items: candidates } = await this.userService.getRecommendedUsers(opts.baseFilter);
    // 统一调用 AI Adapter，所有算法策略均收敛于此
    return this.aiAdapter.matchUsers(user, candidates, opts);
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
