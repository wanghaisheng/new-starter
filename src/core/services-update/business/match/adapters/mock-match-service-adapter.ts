import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services-update/data/types';
import { getUserRelatedMatches, getMatchedUsers as getMatchedUsersUtil } from '../utils/match-aggregation-utils';

/**
 * MockMatchServiceAdapter
 * 用于开发/测试环境，基于注入的数据服务实现全部匹配业务接口
 */
export class MockMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    return getUserRelatedMatches(this.dataService, userId);
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    return getMatchedUsersUtil(this.dataService, userId);
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

  async getMatch(matchId: string): Promise<Match | null> {
    return this.dataService.findOne<Match>('matches', matchId);
  }

  async getMatches(): Promise<Match[]> {
    return this.dataService.query<Match>('matches', {});
  }
}
