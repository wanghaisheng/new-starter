import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/types';
import { MatchServiceOptions } from '../types/match-service';

/**
 * HybridMatchServiceAdapter
 * 离线优先场景，优先本地数据，必要时远程同步
 * 本层只做聚合/过滤，不做 bazi/mbti 智能评分，相关算法全部由 ai-adapters 层负责。
 */
export class HybridMatchServiceAdapter implements IMatchService {
  constructor(private dataService?: IDataService, private options: MatchServiceOptions = {}) {}

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
    // 可选：远程同步
    return match;
  }

  async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match> {
    const updated = await this.dataService?.update<Match>('matches', matchId, data);
    if (!updated) throw new Error('Update failed');
    return updated;
  }

  async deleteMatch(matchId: string): Promise<void> {
    await this.dataService?.delete('matches', matchId);
    // 可选：远程同步删除
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
    // 这里可根据 opts/this.options.brand/algoVersion/featureFlag/userType/region/env 等灵活分流
    // 示例：不同品牌可有不同过滤逻辑
    let candidates = await this.dataService?.query<User>('users', {}) || [];
    // 宽松兼容：仅在 User 类型上做 as any 判断
    if (opts.brand === 'huawei' || this.options.brand === 'huawei') {
      candidates = candidates.filter(u => (u as any).deviceBrand === 'huawei');
    }
    if (opts.region) {
      candidates = candidates.filter(u => (u as any).region === opts.region);
    }
    // 其它条件过滤...
    // 这里只做基础过滤，智能算法交给 AIAdapter
    return candidates;
  }

  async getUserMatchHistory(userId: string): Promise<User[]> {
    // 查询历史匹配用户
    const matches = await this.dataService?.query<Match>('matches', { users: { $elemMatch: userId } });
    const userIds = matches?.map(m => m.users.find(id => id !== userId)).filter(Boolean) as string[];
    if (!userIds || userIds.length === 0) return [];
    const users = await Promise.all(userIds.map(id => this.dataService?.findOne<User>('users', id)));
    return users.filter((user): user is User => !!user);
  }

  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    await this.refreshUserMatches(userId);
  }

  async refreshUserMatches(userId: string): Promise<void> {
    // 可实现 Hybrid 专属刷新逻辑
    return;
  }
}
