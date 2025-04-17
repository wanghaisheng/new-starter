import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services-update/data/types';
import { getUserRelatedMatches, getMatchedUsers as getMatchedUsersUtil } from '../utils/match-aggregation-utils';

/**
 * BrandAMatchServiceAdapter
 * 品牌A定制场景：可实现特殊业务规则（如优先推荐、特殊过滤等）
 */
export class BrandAMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    // 品牌A：基于通用聚合逻辑，并可追加品牌A特殊规则
    const matches = await getUserRelatedMatches(this.dataService, userId);
    // 示例：优先推荐同城匹配（假设有city字段）
    return matches.filter(match => match.city === 'shanghai');
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    // 品牌A：基于通用聚合逻辑，并可追加品牌A特殊规则
    const users = await getMatchedUsersUtil(this.dataService, userId);
    // 示例：过滤未实名用户（假设有isVerified字段）
    return users.filter(user => (user as any).isVerified === true);
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    if (data.users.length !== 2) throw new Error('品牌A仅支持双人匹配');
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
}
