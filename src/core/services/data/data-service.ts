import { User } from '@/core/lib/db/types/user';
import { Match } from '@/core/lib/db/types/match';
import { Message } from '@/core/lib/db/types/message';

export interface IDataService {
  initialize(): Promise<void>;
  clearAll(): Promise<void>;
  
  // User related methods
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Match related methods
  getMatches(): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  createMatch(match: Partial<Match>): Promise<Match>;
  updateMatch(id: string, match: Partial<Match>): Promise<Match>;
  deleteMatch(id: string): Promise<void>;
  
  // Message related methods
  getMessages(matchId?: string): Promise<Message[]>;
  getMessageById(id: string): Promise<Message | null>;
  createMessage(message: Partial<Message>): Promise<Message>;
  updateMessage(id: string, message: Partial<Message>): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
} 