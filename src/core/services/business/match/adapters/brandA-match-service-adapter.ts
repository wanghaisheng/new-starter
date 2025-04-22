import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';
import { getUserRelatedMatches, getMatchedUsers as getMatchedUsersUtil } from '../utils/match-aggregation-utils';
import { MatchServiceOptions } from '../types/match-service';

/**
 * BrandAMatchServiceAdapter
 * 品牌A定制：优先推荐同城用户（如 city === 'shanghai'）
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class BrandAMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService, private options: MatchServiceOptions = {}) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 只做聚合/过滤，不做智能评分
    const matches = await getUserRelatedMatches(this.dataService, userId);
    // 品牌A：优先推荐同城用户（假设有 city 字段或通过 options.region）
    if (this.options.region) {
      return matches.filter(match => (match as any).city === this.options.region);
    }
    return matches.filter(match => (match as any).city === 'shanghai');
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    // 只做聚合/过滤，不做智能评分
    const users = await getMatchedUsersUtil(this.dataService, userId);
    // 品牌A：过滤未实名用户（假设有 isVerified 字段）
    return users.filter(user => (user as any).isVerified === true);
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

  async matchUsers(userId: string, opts: MatchServiceOptions): Promise<User[]> {
    // 可根据 opts/this.options.brand/region/userType 等灵活过滤
    let candidates = await this.dataService.query<User>('users', {}) || [];
    if (opts.region || this.options.region) {
      candidates = candidates.filter(u => (u as any).city === (opts.region || this.options.region));
    }
    if (opts.userType === 'vip' || this.options.userType === 'vip') {
      candidates = candidates.filter(u => (u as any).isVIP === true);
    }
    // 其它品牌定制逻辑...
    return candidates;
  }

  async getUserMatchHistory(userId: string): Promise<User[]> {
    const matches = await this.dataService.query<Match>('matches', { users: { $elemMatch: userId } });
    const userIds = matches?.map(m => m.users.find(id => id !== userId)).filter(Boolean) as string[];
    if (!userIds || userIds.length === 0) return [];
    const users = await Promise.all(userIds.map(id => this.dataService.findOne<User>('users', id)));
    return users.filter((user): user is User => !!user);
  }

  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    await this.refreshUserMatches(userId);
  }

  async refreshUserMatches(userId: string): Promise<void> {
    // 可实现品牌A专属刷新逻辑
    return;
  }
}
