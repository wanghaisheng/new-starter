import { User, Match, Message } from '@/core/lib/db/types';

export interface IDataService {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUsers(): Promise<User[]>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // Match operations
  getMatch(id: string): Promise<Match | null>;
  getMatches(userId: string): Promise<Match[]>;
  createMatch(user1Id: string, user2Id: string): Promise<Match>;
  updateMatch(id: string, data: Partial<Match>): Promise<void>;
  deleteMatch(id: string): Promise<void>;
  
  // Message operations
  getMessage(id: string): Promise<Message | null>;
  getMessages(matchId: string): Promise<Message[]>;
  createMessage(message: Message): Promise<Message>;
  updateMessage(id: string, data: Partial<Message>): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  
  // Additional operations
  getUserMatches(userId: string): Promise<Match[]>;
  getUserMessages(userId: string): Promise<Message[]>;
  getUnreadMessages(userId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  markMessagesAsRead(messageIds: string[]): Promise<void>;
} 