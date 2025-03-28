import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

export type DatabaseEngine = 'mock' | 'indexeddb' | 'sqlite' | 'supabase';

export interface IDatabaseClient {
  // 用户相关操作
  saveUser(user: User): Promise<void>;
  getUser(id: string): Promise<User | null>;
  getUsers(): Promise<User[]>;
  updateUser(user: User): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // 匹配相关操作
  saveMatch(match: Match): Promise<void>;
  getMatch(id: string): Promise<Match | null>;
  getMatchesByUserId(userId: string): Promise<Match[]>;
  updateMatch(match: Match): Promise<void>;
  deleteMatch(id: string): Promise<void>;

  // 消息相关操作
  saveMessage(message: Message): Promise<void>;
  getMessage(id: string): Promise<Message | null>;
  getMessagesByMatchId(matchId: string): Promise<Message[]>;
  updateMessage(message: Message): Promise<void>;
  deleteMessage(id: string): Promise<void>;

  // 数据库管理
  initialize(): Promise<void>;
  clear(): Promise<void>;
  close(): Promise<void>;
}

export interface DatabaseConfig {
  engine: DatabaseEngine;
  name?: string;
  version?: number;
  encryptionKey?: string;
  url?: string;
  key?: string;
}

export interface DatabaseFactory {
  createClient(config: DatabaseConfig): IDatabaseClient;
}

// 平台特定的数据库配置
export interface PlatformDatabaseConfig extends DatabaseConfig {
  // SQLite 特定配置
  sqlite?: {
    location?: string;
    encryptionKey?: string;
  };
  
  // IndexedDB 特定配置
  indexeddb?: {
    storeNames: string[];
  };
  
  // 云端数据库配置
  cloud?: {
    url: string;
    key: string;
    projectId?: string;
  };
}

// 数据同步状态
export interface SyncStatus {
  lastSyncTimestamp: number;
  pendingChanges: number;
  isSyncing: boolean;
  error?: string;
}

// 数据模型接口
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// 用户数据模型
export interface User extends BaseModel {
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
  preferences: UserPreferences;
}

// 用户偏好设置
export interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number;
  gender: string[];
  interests: string[];
}

// 匹配数据模型
export interface Match extends BaseModel {
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'rejected';
  matchedAt?: Date;
}

// 消息数据模型
export interface Message extends BaseModel {
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'location';
  read: boolean;
} 