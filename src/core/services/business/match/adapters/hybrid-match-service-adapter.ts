import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';

/**
 * HybridMatchServiceAdapter
 * 离线优先场景，优先本地数据，必要时远程同步
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class HybridMatchServiceAdapter implements IMatchService {
  constructor(private dataService?: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 只做聚合/过滤，不做智能评分
    let matches = await this.dataService?.query<Match>('matches', {
      $or: [
        { users: [userId] },
        { users: { $elemMatch: userId } },
      ]
    });
    if (!matches || matches.length === 0) {
      // 本地无数据时尝试远程拉取
      try {
        const response = await fetch(`/api/match/user/${userId}`);
        if (response.ok) {
          matches = await response.json();
          // 可选：同步到本地数据服务
          for (const match of matches) {
            await this.dataService?.insert<Match>('matches', match);
          }
        }
      } catch (e) {
        // 网络异常时降级为本地
      }
    }
    return matches?.filter(match => match.users.includes(userId)) ?? [];
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    // 只做聚合/过滤，不做智能评分
    const matches = await this.getUserMatches(userId);
    const matchedUserIds = matches
      .filter(match => match.status === 'matched')
      .map(match => match.users[0] === userId ? match.users[1] : match.users[0]);
    if (matchedUserIds.length === 0) return [];
    const users = await Promise.all(
      matchedUserIds.map(id => this.dataService?.findOne<User>('users', id))
    );
    return users.filter((user): user is User => !!user);
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    // 先本地插入，再远程同步
    const now = new Date();
    const match: Match = {
      id: crypto.randomUUID(),
      users: data.users,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await this.dataService?.insert<Match>('matches', match);
    // 尝试远程同步（忽略失败）
    fetch(`/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
    return match;
  }

  async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match> {
    const updated = await this.dataService?.update<Match>('matches', matchId, data);
    // 远程同步
    fetch(`/api/match/${matchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
    if (!updated) throw new Error('Local update failed');
    return updated;
  }

  async deleteMatch(matchId: string): Promise<void> {
    await this.dataService?.delete('matches', matchId);
    // 远程同步
    fetch(`/api/match/${matchId}`, { method: 'DELETE' }).catch(() => {});
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
    let users = await this.getMatchedUsers(userId);
    if (opts.limit) users = users.slice(0, opts.limit);
    return users;
  }

  async getUserMatchHistory(userId: string): Promise<User[]> {
    return this.getMatchedUsers(userId);
  }

  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    await this.refreshUserMatches(userId);
  }

  async refreshUserMatches(userId: string): Promise<void> {
    return;
  }
}
