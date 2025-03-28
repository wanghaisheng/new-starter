import { IDatabaseClient } from '../interfaces';
import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

interface IndexedDBConfig {
  name: string;
  version: number;
}

export class IndexedDBClient implements IDatabaseClient {
  private db: IDBDatabase | null = null;
  private config: IndexedDBConfig;

  constructor(config: IndexedDBConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建用户存储
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建匹配存储
        if (!db.objectStoreNames.contains('matches')) {
          const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
          matchStore.createIndex('userId1', 'userId1', { unique: false });
          matchStore.createIndex('userId2', 'userId2', { unique: false });
          matchStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建消息存储
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('matchId', 'matchId', { unique: false });
          messageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(
      ['users', 'matches', 'messages'],
      'readwrite'
    );

    await Promise.all([
      this.clearStore(transaction.objectStore('users')),
      this.clearStore(transaction.objectStore('matches')),
      this.clearStore(transaction.objectStore('messages'))
    ]);
  }

  private clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // 用户相关操作
  async saveUser(user: User): Promise<void> {
    await this.put('users', user);
  }

  async getUser(id: string): Promise<User | null> {
    return await this.get('users', id);
  }

  async getUsers(): Promise<User[]> {
    return await this.getAll('users');
  }

  async updateUser(user: User): Promise<void> {
    await this.put('users', user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.delete('users', id);
  }

  // 匹配相关操作
  async saveMatch(match: Match): Promise<void> {
    await this.put('matches', match);
  }

  async getMatch(id: string): Promise<Match | null> {
    return await this.get('matches', id);
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction('matches', 'readonly');
    const store = transaction.objectStore('matches');
    const index1 = store.index('userId1');
    const index2 = store.index('userId2');

    const matches1 = await this.getAllFromIndex<Match>(index1, userId);
    const matches2 = await this.getAllFromIndex<Match>(index2, userId);

    return [...matches1, ...matches2];
  }

  async updateMatch(match: Match): Promise<void> {
    await this.put('matches', match);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.delete('matches', id);
  }

  // 消息相关操作
  async saveMessage(message: Message): Promise<void> {
    await this.put('messages', message);
  }

  async getMessage(id: string): Promise<Message | null> {
    return await this.get('messages', id);
  }

  async getMessagesByMatchId(matchId: string): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction('messages', 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('matchId');

    const messages = await this.getAllFromIndex<Message>(index, matchId);
    return messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async updateMessage(message: Message): Promise<void> {
    await this.put('messages', message);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.delete('messages', id);
  }

  // 通用数据库操作方法
  private async put<T>(storeName: string, value: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromIndex<T>(index: IDBIndex, key: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
} 