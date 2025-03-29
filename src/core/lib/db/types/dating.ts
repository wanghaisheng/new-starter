import { BaseEntity } from './base-entity';

// 用户相关类型
export interface User extends BaseEntity {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  photos: Photo[];
  bio?: string;
  interests: string[];
  location: Location;
  preferences: UserPreferences;
  isVerified: boolean;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface Photo extends BaseEntity {
  url: string;
  order: number;
  isMain: boolean;
  userId: string;
}

export interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number; // 最大距离（公里）
  gender: ('male' | 'female' | 'other')[];
  interests: string[];
  dealBreakers?: string[];
}

// 匹配相关类型
export interface Match extends BaseEntity {
  users: [string, string]; // 用户ID对
  status: 'pending' | 'matched' | 'rejected';
}

export interface MatchAction extends BaseEntity {
  userId: string;
  targetUserId: string;
  action: 'like' | 'dislike' | 'superlike';
  createdAt: Date;
}

// 消息相关类型
export interface Message extends BaseEntity {
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  status: 'sent' | 'delivered' | 'read';
}

// 用户互动相关类型
export interface Report extends BaseEntity {
  reporterId: string;
  targetUserId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  resolution?: {
    action: 'warning' | 'suspension' | 'ban';
    note: string;
    resolvedAt: Date;
  };
}

export interface Block extends BaseEntity {
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: Date;
  expiresAt?: Date;
}

// 数据库操作接口
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