import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { User, Match, Message } from '@/core/lib/db/types';
import { IDataService } from './data-service.interface';
import { initializeSQLite } from '@/core/lib/db/clients/capacitor-sqlite/init-sqlite';

export class DatabaseService implements IDataService {
  private static instance: DatabaseService;
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isInitialized = false;

  private constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化 SQLite
      await initializeSQLite();

      // 创建数据库连接
      this.db = await this.sqlite.createConnection(
        'swipemeet_db',
        false,
        'no-encryption',
        1,
        false
      );

      // 打开数据库
      await this.db.open();

      // 创建表
      await this.createTables();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // 用户表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        bio TEXT,
        images TEXT,
        interests TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 匹配表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        user1_id TEXT NOT NULL,
        user2_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_id) REFERENCES users (id),
        FOREIGN KEY (user2_id) REFERENCES users (id)
      )
    `);

    // 消息表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT 0,
        FOREIGN KEY (match_id) REFERENCES matches (id),
        FOREIGN KEY (sender_id) REFERENCES users (id)
      )
    `);
  }

  // User operations
  public async createUser(user: User): Promise<User> {
    const { images, interests, location } = user;
    await this.db.execute(
      `INSERT INTO users (id, name, age, bio, images, interests, location, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        user.age,
        user.bio,
        JSON.stringify(images),
        JSON.stringify(interests),
        JSON.stringify(location)
      ]
    );
    return user;
  }

  public async updateUser(id: string, data: Partial<User>): Promise<void> {
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'images' || key === 'interests' || key === 'location') {
        updates.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await this.db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteUser(id: string): Promise<void> {
    await this.db.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  public async getUser(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      const user = result.values[0];
      return {
        ...user,
        images: JSON.parse(user.images),
        interests: JSON.parse(user.interests),
        location: JSON.parse(user.location)
      };
    }
    return null;
  }

  public async getUsers(): Promise<User[]> {
    const result = await this.db.query('SELECT * FROM users');
    return (result.values || []).map(user => ({
      ...user,
      images: JSON.parse(user.images),
      interests: JSON.parse(user.interests),
      location: JSON.parse(user.location)
    }));
  }

  // Match operations
  public async getMatch(id: string): Promise<Match | null> {
    const result = await this.db.query('SELECT * FROM matches WHERE id = ?', [id]);
    if (result.values && result.values.length > 0) {
      const match = result.values[0];
      return {
        ...match,
        users: [match.user1_id, match.user2_id]
      };
    }
    return null;
  }

  public async getMatches(userId: string): Promise<Match[]> {
    const result = await this.db.query(
      'SELECT * FROM matches WHERE user1_id = ? OR user2_id = ?',
      [userId, userId]
    );
    return (result.values || []).map(match => ({
      ...match,
      users: [match.user1_id, match.user2_id]
    }));
  }

  public async createMatch(user1Id: string, user2Id: string): Promise<Match> {
    const id = Date.now().toString();
    await this.db.execute(
      `INSERT INTO matches (id, user1_id, user2_id, created_at, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, user1Id, user2Id]
    );
    
    return {
      id,
      user1Id,
      user2Id,
      isMatched: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  public async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await this.db.execute(
      `UPDATE matches SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteMatch(id: string): Promise<void> {
    await this.db.execute('DELETE FROM matches WHERE id = ?', [id]);
  }

  public async saveMatch(match: Match): Promise<void> {
    await this.db.execute(
      `INSERT OR REPLACE INTO matches (id, user1_id, user2_id, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [match.id, match.user1Id, match.user2Id]
    );
  }

  // Message operations
  public async getMessage(id: string): Promise<Message | null> {
    const result = await this.db.query('SELECT * FROM messages WHERE id = ?', [id]);
    if (result.values && result.values.length > 0) {
      return result.values[0];
    }
    return null;
  }

  public async getMessages(matchId: string): Promise<Message[]> {
    const result = await this.db.query(
      'SELECT * FROM messages WHERE match_id = ? ORDER BY timestamp DESC',
      [matchId]
    );
    return result.values || [];
  }

  public async createMessage(message: Message): Promise<Message> {
    await this.db.execute(
      `INSERT INTO messages (id, match_id, sender_id, text, timestamp, read)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [message.id, message.matchId, message.senderId, message.content, false]
    );
    return message;
  }

  public async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    values.push(id);
    
    await this.db.execute(
      `UPDATE messages SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteMessage(id: string): Promise<void> {
    await this.db.execute('DELETE FROM messages WHERE id = ?', [id]);
  }

  public async saveMessage(message: Message): Promise<void> {
    await this.db.execute(
      `INSERT OR REPLACE INTO messages (id, match_id, sender_id, text, timestamp, read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [message.id, message.matchId, message.senderId, message.content, message.createdAt, message.isRead]
    );
  }

  // Additional operations
  public async getUserMatches(userId: string): Promise<Match[]> {
    return this.getMatches(userId);
  }

  public async getUserMessages(userId: string): Promise<Message[]> {
    const result = await this.db.query(
      'SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY timestamp DESC',
      [userId, userId]
    );
    return result.values || [];
  }

  public async getUnreadMessages(userId: string): Promise<Message[]> {
    const result = await this.db.query(
      'SELECT * FROM messages WHERE receiver_id = ? AND read = 0 ORDER BY timestamp DESC',
      [userId]
    );
    return result.values || [];
  }

  public async markMessageAsRead(messageId: string): Promise<void> {
    await this.db.execute(
      'UPDATE messages SET read = 1 WHERE id = ?',
      [messageId]
    );
  }

  public async markMessagesAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    const placeholders = messageIds.map(() => '?').join(',');
    await this.db.execute(
      `UPDATE messages SET read = 1 WHERE id IN (${placeholders})`,
      messageIds
    );
  }

  // 清理数据
  public async clearAll(): Promise<void> {
    await this.db.execute('DELETE FROM messages');
    await this.db.execute('DELETE FROM matches');
    await this.db.execute('DELETE FROM users');
  }

  // 关闭数据库
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
    }
  }
}