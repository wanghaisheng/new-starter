import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';
import { getUserRelatedMatches, getMatchedUsers as getMatchedUsersUtil } from '../utils/match-aggregation-utils';

/**
 * BrandBMatchServiceAdapter
 * 品牌B定制：只展示 VIP 用户、过滤黑名单
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class BrandBMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 只做聚合/过滤，不做智能评分
    const matches = await getUserRelatedMatches(this.dataService, userId);
    // 品牌B：过滤黑名单（假设有 isBlacklisted 字段）
    return matches.filter(match => !(match as any).isBlacklisted);
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    // 只做聚合/过滤，不做智能评分
    const users = await getMatchedUsersUtil(this.dataService, userId);
    // 品牌B：只展示 VIP 用户（假设有 isVIP 字段）
    return users.filter(user => (user as any).isVIP === true);
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    const now = new Date();
    const match: Match = {
      id: crypto.randomUUID(),
      users: data.users,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    return this.dataService.insert<Match>('matches', match);
  }

  async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match> {
    const updated = await this.dataService.update<Match>('matches', matchId, data);
    if (!updated) throw new Error('Update failed');
    return updated;
  }

  async deleteMatch(matchId: string): Promise<void> {
    await this.dataService.delete('matches', matchId);
  }

  async isMatchedWith(userId: string, targetUserId: string): Promise<boolean> {
    const matches = await this.getUserMatches(userId);
    return matches.some(match => match.users.includes(targetUserId) && match.status === 'matched');
  }

  async getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'> {
    const matches = await this.getUserMatches(userId);
    const match = matches.find(m => m.users.includes(targetUserId));
    if (!match) return 'none';
    return match.status as 'matched' | 'pending' | 'none';
  }

  /**
   * 综合多机制智能匹配（地理、兴趣、mbti、八字等）
   * 实际算法由 AI Adapter 层实现，这里只做基础聚合和过滤，可用于品牌定制二次过滤
   */
  async matchUsers(userId: string, opts: {
    maxDistanceKm?: number;
    includeTags?: string[];
    excludeTags?: string[];
    useRandom?: boolean;
    useBazi?: boolean;
    useMBTI?: boolean;
    mbtiType?: string;
    limit?: number;
  }): Promise<User[]> {
    // 默认：先获取已匹配用户，可根据 opts 做定制过滤
    let users = await getMatchedUsersUtil(this.dataService, userId);
    // 示例：品牌B只展示VIP
    users = users.filter(user => (user as any).isVIP === true);
    if (opts.limit) users = users.slice(0, opts.limit);
    return users;
  }

  /**
   * 获取用户所有相关的历史匹配对象（含已过期/已解除/所有历史）
   */
  async getUserMatchHistory(userId: string): Promise<User[]> {
    // 可根据业务需求聚合所有历史匹配对象
    return getMatchedUsersUtil(this.dataService, userId); // 可扩展历史数据聚合逻辑
  }

  /**
   * quiz 结果联动入口：接收标签和报告，自动刷新用户标签、触发推荐等
   */
  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    // 这里只做触发刷新，具体实现可交由AI层或外部注入
    await this.refreshUserMatches(userId);
  }

  /**
   * 根据最新标签/画像刷新推荐池
   */
  async refreshUserMatches(userId: string): Promise<void> {
    // 可在此触发本地/远程同步等操作
    // 示例：无实际操作，仅为接口合规
    return;
  }
}
