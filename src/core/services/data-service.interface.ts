import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

export interface IDataService {
  // 用户相关方法
  saveUser(user: User): Promise<void>;
  getUser(id: string): Promise<User | null>;
  getUsers(): Promise<User[]>;
  
  // 匹配相关方法
  saveMatch(match: Match): Promise<void>;
  getMatches(): Promise<Match[]>;
  
  // 消息相关方法
  saveMessage(message: Message): Promise<void>;
  getMessages(): Promise<Message[]>;
  
  // 数据管理方法
  clearAll(): Promise<void>;
  initialize(): Promise<void>;
} 