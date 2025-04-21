import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';
import { getUserRelatedMatches, getMatchedUsers as getMatchedUsersUtil } from '../utils/match-aggregation-utils';

/**
 * MockMatchServiceAdapter
 * 用于开发/测试环境，基于注入的数据服务实现全部匹配业务接口
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class MockMatchServiceAdapter implements IMatchService {
  constructor(private dataService?: IDataService) {}

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

  /**
   * 综合多机制智能匹配（地理、兴趣、mbti、八字等）
   * 实际算法由 AI Adapter 层实现，这里只做基础聚合和过滤
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
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    let users = await getMatchedUsersUtil(this.dataService, userId);
    if (opts.limit) users = users.slice(0, opts.limit);
    return users;
  }

  async getUserMatchHistory(userId: string): Promise<User[]> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    return getMatchedUsersUtil(this.dataService, userId);
  }

  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    await this.refreshUserMatches(userId);
  }

  async refreshUserMatches(userId: string): Promise<void> {
    if (!this.dataService) throw new Error('MockMatchServiceAdapter: dataService 未注入');
    return;
  }
}
