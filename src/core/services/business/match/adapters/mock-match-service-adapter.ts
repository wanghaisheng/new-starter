import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';
import { getUserRelatedMatches, getMatchedUsers as getMatchedUsersUtil } from '../utils/match-aggregation-utils';
import { MatchServiceOptions } from '../types/match-service';

/**
 * MockMatchServiceAdapter
 * 用于开发/测试环境，基于注入的数据服务实现全部匹配业务接口
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class MockMatchServiceAdapter implements IMatchService {
  constructor(private dataService?: IDataService, private options: MatchServiceOptions = {}) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 只做聚合/过滤，不做智能评分
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    return getUserRelatedMatches(this.dataService, userId);
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    return getMatchedUsersUtil(this.dataService, userId);
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
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
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    const updated = await this.dataService.update<Match>('matches', matchId, data);
    if (!updated) throw new Error('Update failed');
    return updated;
  }

  async deleteMatch(matchId: string): Promise<void> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    await this.dataService.delete('matches', matchId);
  }

  async isMatchedWith(userId: string, targetUserId: string): Promise<boolean> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    const matches = await this.getUserMatches(userId);
    return matches.some(match => match.users.includes(targetUserId) && match.status === 'matched');
  }

  async getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    const matches = await this.getUserMatches(userId);
    const match = matches.find(m => m.users.includes(targetUserId));
    if (!match) return 'none';
    return match.status as 'matched' | 'pending' | 'none';
  }

  async matchUsers(userId: string, opts: MatchServiceOptions): Promise<User[]> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    let candidates = await this.dataService.query<User>('users', {}) || [];
    // 支持 mock 环境下多维过滤
    if (opts.brand) {
      candidates = candidates.filter(u => (u as any).brand === opts.brand);
    }
    if (opts.region) {
      candidates = candidates.filter(u => (u as any).region === opts.region);
    }
    // 其它 mock 策略过滤...
    return candidates;
  }

  async getUserMatchHistory(userId: string): Promise<User[]> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    const matches = await this.dataService.query<Match>('matches', { users: { $elemMatch: userId } });
    const userIds = (matches?.map(m => m.users.find(id => id !== userId)).filter((id): id is string => !!id)) || [];
    if (userIds.length === 0) return [];
    const users = await Promise.all(userIds.map(id => this.dataService!.findOne<User>('users', id)));
    return users.filter((user): user is User => !!user);
  }

  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    await this.refreshUserMatches(userId);
  }

  async refreshUserMatches(userId: string): Promise<void> {
    // 可实现 mock 专属刷新逻辑
    return;
  }
}
