import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';

/**
 * RemoteMatchServiceAdapter
 * 生产环境/远程API场景，所有操作通过远程接口实现
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class RemoteMatchServiceAdapter implements IMatchService {
  constructor(private dataService?: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 只做聚合/过滤，不做智能评分
    const response = await fetch(`/api/match/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user matches');
    const matches: Match[] = await response.json();
    return matches;
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    // 只做聚合/过滤，不做智能评分
    const response = await fetch(`/api/match/user/${userId}/matched-users`);
    if (!response.ok) throw new Error('Failed to fetch matched users');
    const users: User[] = await response.json();
    return users;
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    const response = await fetch(`/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create match');
    const match: Match = await response.json();
    return match;
  }

  async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match> {
    const response = await fetch(`/api/match/${matchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update match');
    const match: Match = await response.json();
    return match;
  }

  async deleteMatch(matchId: string): Promise<void> {
    const response = await fetch(`/api/match/${matchId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete match');
  }

  async isMatchedWith(userId: string, targetUserId: string): Promise<boolean> {
    const response = await fetch(`/api/match/is-matched?userId=${userId}&targetUserId=${targetUserId}`);
    if (!response.ok) throw new Error('Failed to check match status');
    const result = await response.json();
    return !!result.matched;
  }

  async getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'> {
    const response = await fetch(`/api/match/status?userId=${userId}&targetUserId=${targetUserId}`);
    if (!response.ok) throw new Error('Failed to get match status');
    const result = await response.json();
    return result.status as 'matched' | 'pending' | 'none';
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
    // 远程API实现，实际算法由AI层负责
    const response = await fetch(`/api/match/user/${userId}/matched-users`);
    if (!response.ok) throw new Error('Failed to fetch matched users');
    let users: User[] = await response.json();
    if (opts.limit) users = users.slice(0, opts.limit);
    return users;
  }

  async getUserMatchHistory(userId: string): Promise<User[]> {
    // 远程API实现
    const response = await fetch(`/api/match/user/${userId}/history`);
    if (!response.ok) throw new Error('Failed to fetch match history');
    return response.json();
  }

  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    await this.refreshUserMatches(userId);
  }

  async refreshUserMatches(userId: string): Promise<void> {
    // 可远程触发刷新推荐池
    return;
  }
}
