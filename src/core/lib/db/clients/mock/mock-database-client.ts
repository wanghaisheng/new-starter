import { IDatabaseClient } from '../interfaces';
import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

export class MockDatabaseClient implements IDatabaseClient {
  private users: Map<string, User> = new Map();
  private matches: Map<string, Match> = new Map();
  private messages: Map<string, Message> = new Map();

  async initialize(): Promise<void> {
    // 加载模拟数据
    const mockUsers: User[] = [
      {
        id: '1',
        name: '张三',
        age: 25,
        bio: '喜欢运动和音乐',
        images: ['https://picsum.photos/400/600?random=1'],
        interests: ['运动', '音乐', '旅行'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '李四',
        age: 28,
        bio: '热爱美食和摄影',
        images: ['https://picsum.photos/400/600?random=2'],
        interests: ['美食', '摄影', '电影'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    mockUsers.forEach(user => this.users.set(user.id, user));
  }

  async clear(): Promise<void> {
    this.users.clear();
    this.matches.clear();
    this.messages.clear();
  }

  async close(): Promise<void> {
    // Mock实现不需要关闭操作
  }

  // 用户相关操作
  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(user: User): Promise<void> {
    if (this.users.has(user.id)) {
      this.users.set(user.id, user);
    } else {
      throw new Error(`User not found: ${user.id}`);
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  // 匹配相关操作
  async saveMatch(match: Match): Promise<void> {
    this.matches.set(match.id, match);
  }

  async getMatch(id: string): Promise<Match | null> {
    return this.matches.get(id) || null;
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      match => match.userId1 === userId || match.userId2 === userId
    );
  }

  async updateMatch(match: Match): Promise<void> {
    if (this.matches.has(match.id)) {
      this.matches.set(match.id, match);
    } else {
      throw new Error(`Match not found: ${match.id}`);
    }
  }

  async deleteMatch(id: string): Promise<void> {
    this.matches.delete(id);
  }

  // 消息相关操作
  async saveMessage(message: Message): Promise<void> {
    this.messages.set(message.id, message);
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.messages.get(id) || null;
  }

  async getMessagesByMatchId(matchId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.matchId === matchId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async updateMessage(message: Message): Promise<void> {
    if (this.messages.has(message.id)) {
      this.messages.set(message.id, message);
    } else {
      throw new Error(`Message not found: ${message.id}`);
    }
  }

  async deleteMessage(id: string): Promise<void> {
    this.messages.delete(id);
  }
} 