import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services-update/data/types';

/**
 * BrandBMatchServiceAdapter
 * 品牌B定制场景：如特殊匹配规则、黑名单过滤、优先级排序等
 */
export class BrandBMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 品牌B：示例，过滤黑名单用户
    const matches = await this.dataService.query<Match>('matches', {
      users: { $elemMatch: userId }
    });
    // 假设有黑名单字段
    return matches.filter(match => match.users.includes(userId) && !match.isBlacklisted);
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    const matches = await this.getUserMatches(userId);
    const matchedUserIds = matches
      .filter(match => match.status === 'matched')
      .map(match => match.users[0] === userId ? match.users[1] : match.users[0]);
    if (matchedUserIds.length === 0) return [];
    const users = await Promise.all(
      matchedUserIds.map(id => this.dataService.findOne<User>('users', id))
    );
    // 品牌B：示例，优先展示VIP用户
    return users
      .filter((user): user is User => !!user)
      .sort((a, b) => (b.isVIP ? 1 : 0) - (a.isVIP ? 1 : 0));
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    // 品牌B：示例，自动设置特殊标记
    const now = new Date();
    const match: Match = {
      id: crypto.randomUUID(),
      users: data.users,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      isBrandBSpecial: true,
    } as Match;
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
}
