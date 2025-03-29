import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';
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

  // 用户相关方法
  public async saveUser(user: User): Promise<void> {
    const { images, interests, location } = user;
    await this.db.execute(
      `INSERT OR REPLACE INTO users (id, name, age, bio, images, interests, location, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
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

  // 匹配相关方法
  public async saveMatch(match: Match): Promise<void> {
    await this.db.execute(
      `INSERT OR REPLACE INTO matches (id, user1_id, user2_id, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [match.id, match.users[0], match.users[1]]
    );
  }

  public async getMatches(): Promise<Match[]> {
    const result = await this.db.query('SELECT * FROM matches');
    return (result.values || []).map(match => ({
      ...match,
      users: [match.user1_id, match.user2_id]
    }));
  }

  // 消息相关方法
  public async saveMessage(message: Message): Promise<void> {
    await this.db.execute(
      `INSERT OR REPLACE INTO messages (id, match_id, sender_id, text, timestamp, read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [message.id, message.matchId, message.senderId, message.text, message.timestamp, message.read]
    );
  }

  public async getMessages(): Promise<Message[]> {
    const result = await this.db.query('SELECT * FROM messages ORDER BY timestamp DESC');
    return result.values || [];
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