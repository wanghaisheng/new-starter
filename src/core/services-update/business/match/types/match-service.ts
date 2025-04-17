import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';

/**
 * 匹配服务接口（新架构）
 * 仅定义基础数据操作及核心业务方法
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
