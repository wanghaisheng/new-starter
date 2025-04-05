import { Report, Block } from './interaction';
import { Match, MatchAction } from './match';
import { Message } from './message';
import { Photo } from './photo';
import { User } from './user';
import { UserPreferences } from './user';

/**
 * 约会应用仓库接口
 * 定义与约会应用相关的所有数据库操作
 */
export interface IDatingRepository {
  // 用户相关
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // 照片相关
  addPhoto(userId: string, photo: Omit<Photo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Photo>;
  updatePhoto(id: string, data: Partial<Photo>): Promise<Photo>;
  deletePhoto(id: string): Promise<void>;
  getPhotosByUserId(userId: string): Promise<Photo[]>;
  
  // 匹配相关
  createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match>;
  getMatchById(id: string): Promise<Match | null>;
  getMatchesByUserId(userId: string): Promise<Match[]>;
  updateMatchStatus(id: string, status: Match['status']): Promise<Match>;
  
  // 消息相关
  sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message>;
  getMessagesByMatchId(matchId: string): Promise<Message[]>;
  updateMessageStatus(id: string, status: Message['status']): Promise<Message>;
  
  // 查询相关
  findPotentialMatches(userId: string, preferences: UserPreferences): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  
  // 匹配操作相关
  createMatchAction(action: Omit<MatchAction, 'id'>): Promise<MatchAction>;
  getMatchActionsByUserId(userId: string): Promise<MatchAction[]>;
  
  // 用户互动相关
  createReport(report: Omit<Report, 'id'>): Promise<Report>;
  getReportsByTargetId(targetId: string): Promise<Report[]>;
  updateReportStatus(id: string, status: Report['status'], resolution?: Report['resolution']): Promise<Report>;
  
  createBlock(block: Omit<Block, 'id'>): Promise<Block>;
  getBlocksByBlockerId(blockerId: string): Promise<Block[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  
  // 推荐系统相关
  getRecommendedUsers(userId: string, options?: {
    limit?: number;
    offset?: number;
    filters?: {
      ageRange?: UserPreferences['ageRange'];
      distance?: number;
      gender?: UserPreferences['gender'];
    };
  }): Promise<{ users: User[]; total: number }>;
}