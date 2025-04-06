import { Match, CreateMatchData, UpdateMatchData, MatchAction } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data-service-interface';
import { NetworkService } from '@/core/services/network-service';

/**
 * 匹配服务接口
 */
export interface IMatchService {
  getUserMatches(userId: string): Promise<Match[]>;
  getMatchedUsers(userId: string): Promise<User[]>;
  createMatch(data: CreateMatchData): Promise<Match>;
  updateMatch(matchId: string, data: UpdateMatchData): Promise<Match>;
  deleteMatch(matchId: string): Promise<void>;
  isMatchedWith(userId: string, targetUserId: string): Promise<boolean>;
  getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'>;
}

/**
 * 匹配服务
 * 提供用户匹配相关的功能
 */
export class MatchService implements IMatchService {
  private static instance: MatchService;
  private dataService: IDataService;
  private networkService: NetworkService;

  private constructor(dataService: IDataService) {
    this.dataService = dataService;
    this.networkService = NetworkService.getInstance();
  }

  public static getInstance(dataService: IDataService): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService(dataService);
    }
    return MatchService.instance;
  }

  public async getUserMatches(userId: string): Promise<Match[]> {
    try {
      if (!this.networkService.isOnline()) {
        return this.dataService.getMatches(userId);
      }

      const matches = await this.dataService.getMatches(userId);
      return matches;
    } catch (error) {
      console.error('Error getting user matches:', error);
      throw error;
    }
  }

  public async getMatchedUsers(userId: string): Promise<User[]> {
    try {
      const matches = await this.getUserMatches(userId);
      const matchedUserIds = matches
        .filter(match => match.status === 'matched')
        .map(match => match.users[0] === userId ? match.users[1] : match.users[0]);

      if (matchedUserIds.length === 0) {
        return [];
      }

      const users = await Promise.all(
        matchedUserIds.map(id => this.dataService.getUser(id))
      );

      return users.filter((user): user is User => user !== null);
    } catch (error) {
      console.error('Error getting matched users:', error);
      throw error;
    }
  }

  public async createMatch(data: CreateMatchData): Promise<Match> {
    try {
      if (!this.networkService.isOnline()) {
        throw new Error('Cannot create match while offline');
      }

      const now = new Date();
      const match: Match = {
        id: crypto.randomUUID(),
        users: data.users,
        status: data.status || 'pending',
        createdAt: now,
        updatedAt: now
      };

      const createdMatch = await this.dataService.createMatch(match);
      return createdMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  public async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match> {
    try {
      if (!this.networkService.isOnline()) {
        throw new Error('Cannot update match while offline');
      }

      const match = await this.dataService.updateMatch(matchId, {
        ...data,
        updatedAt: new Date()
      });
      return match;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  public async deleteMatch(matchId: string): Promise<void> {
    try {
      if (!this.networkService.isOnline()) {
        throw new Error('Cannot delete match while offline');
      }

      await this.dataService.deleteMatch(matchId);
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }

  public async isMatchedWith(userId: string, targetUserId: string): Promise<boolean> {
    try {
      const status = await this.getMatchStatus(userId, targetUserId);
      return status === 'matched';
    } catch (error) {
      console.error('Error checking match status:', error);
      throw error;
    }
  }

  public async getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'> {
    try {
      const matches = await this.getUserMatches(userId);
      const match = matches.find(m => 
        (m.users[0] === userId && m.users[1] === targetUserId) ||
        (m.users[0] === targetUserId && m.users[1] === userId)
      );

      if (!match) {
        return 'none';
      }

      return match.status === 'rejected' ? 'none' : match.status;
    } catch (error) {
      console.error('Error getting match status:', error);
      throw error;
    }
  }
} 