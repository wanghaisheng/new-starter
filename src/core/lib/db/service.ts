import { DatabaseFactory } from './factory';
import { DatabaseClient, PlatformDatabaseConfig, User, Match, Message } from './interfaces';

export class DatabaseService {
  private static instance: DatabaseService;
  private client?: DatabaseClient;
  private factory: DatabaseFactory;

  private constructor() {
    this.factory = DatabaseFactory.getInstance();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(config: PlatformDatabaseConfig): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }

    this.client = this.factory.createClient(config);
    await this.client.connect();
  }

  // 用户相关操作
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.client.execute(
      'INSERT INTO users (id, username, email, profile_image, bio, preferences, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newUser.id,
        newUser.username,
        newUser.email,
        newUser.profileImage,
        newUser.bio,
        JSON.stringify(newUser.preferences),
        newUser.createdAt.toISOString(),
        newUser.updatedAt.toISOString(),
      ]
    );

    return newUser;
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const users = await this.client.query<User>(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    return users[0] || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const user = await this.getUser(id);
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    await this.client.execute(
      'UPDATE users SET username = ?, email = ?, profile_image = ?, bio = ?, preferences = ?, updated_at = ? WHERE id = ?',
      [
        updatedUser.username,
        updatedUser.email,
        updatedUser.profileImage,
        updatedUser.bio,
        JSON.stringify(updatedUser.preferences),
        updatedUser.updatedAt.toISOString(),
        id,
      ]
    );

    return updatedUser;
  }

  // 匹配相关操作
  async createMatch(userId1: string, userId2: string): Promise<Match> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const newMatch: Match = {
      id: crypto.randomUUID(),
      userId1,
      userId2,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.client.execute(
      'INSERT INTO matches (id, user_id1, user_id2, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        newMatch.id,
        newMatch.userId1,
        newMatch.userId2,
        newMatch.status,
        newMatch.createdAt.toISOString(),
        newMatch.updatedAt.toISOString(),
      ]
    );

    return newMatch;
  }

  async updateMatchStatus(id: string, status: Match['status']): Promise<Match | null> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const matches = await this.client.query<Match>(
      'SELECT * FROM matches WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!matches[0]) {
      return null;
    }

    const updatedMatch: Match = {
      ...matches[0],
      status,
      matchedAt: status === 'accepted' ? new Date() : undefined,
      updatedAt: new Date(),
    };

    await this.client.execute(
      'UPDATE matches SET status = ?, matched_at = ?, updated_at = ? WHERE id = ?',
      [
        updatedMatch.status,
        updatedMatch.matchedAt?.toISOString(),
        updatedMatch.updatedAt.toISOString(),
        id,
      ]
    );

    return updatedMatch;
  }

  // 消息相关操作
  async createMessage(matchId: string, senderId: string, content: string, type: Message['type']): Promise<Message> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      matchId,
      senderId,
      content,
      type,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.client.execute(
      'INSERT INTO messages (id, match_id, sender_id, content, type, read, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newMessage.id,
        newMessage.matchId,
        newMessage.senderId,
        newMessage.content,
        newMessage.type,
        newMessage.read,
        newMessage.createdAt.toISOString(),
        newMessage.updatedAt.toISOString(),
      ]
    );

    return newMessage;
  }

  async getMessages(matchId: string): Promise<Message[]> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    return this.client.query<Message>(
      'SELECT * FROM messages WHERE match_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
      [matchId]
    );
  }

  async markMessageAsRead(id: string): Promise<void> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    await this.client.execute(
      'UPDATE messages SET read = true, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  // 数据同步
  async sync(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    await this.client.sync();
  }

  async getLastSyncTimestamp(): Promise<number> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    return this.client.getLastSyncTimestamp();
  }

  // 清理资源
  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = undefined;
    }
  }
} 