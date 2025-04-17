import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services-update/data/types';

/**
 * RemoteMatchServiceAdapter
 * 生产环境/远程API场景，所有操作通过远程接口实现
 * 可根据实际API协议进行调整
 */
export class RemoteMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService) {}

  async getUserMatches(userId: string): Promise<Match[]> {
    const response = await fetch(`/api/match/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user matches');
    const matches: Match[] = await response.json();
    return matches;
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
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
}
