import { User, Match, Message } from '@/core/lib/db/types';
import { Storage } from '@capacitor/storage';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

export interface StorageConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

// 添加获取Firebase配置的函数
function getFirebaseConfig(): StorageConfig {
  return {
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
    }
  };
}

export interface IStorageService {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUsers(): Promise<User[]>;
  saveUser(user: User): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Match operations
  getMatch(id: string): Promise<Match | null>;
  getMatches(userId: string): Promise<Match[]>;
  saveMatch(match: Match): Promise<void>;
  deleteMatch(id: string): Promise<void>;

  // Message operations
  getMessage(id: string): Promise<Message | null>;
  getMessages(matchId: string): Promise<Message[]>;
  saveMessage(message: Message): Promise<void>;
  deleteMessage(id: string): Promise<void>;

  // Additional operations
  getUserMatches(userId: string): Promise<Match[]>;
  getUserMessages(userId: string): Promise<Message[]>;
  getUnreadMessages(userId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  markMessagesAsRead(messageIds: string[]): Promise<void>;

  // Storage management
  clear(): Promise<void>;
  initialize(): Promise<void>;
}

export class LocalStorageService implements IStorageService {
  private static instance: LocalStorageService;
  private users: Map<string, User> = new Map();
  private matches: Map<string, Match> = new Map();
  private messages: Map<string, Message> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load data from localStorage
      const usersData = localStorage.getItem('users');
      const matchesData = localStorage.getItem('matches');
      const messagesData = localStorage.getItem('messages');

      if (usersData) {
        const users = JSON.parse(usersData) as User[];
        users.forEach(user => {
          user.createdAt = new Date(user.createdAt);
          user.updatedAt = new Date(user.updatedAt);
          if (user.birthDate) {
            user.birthDate = new Date(user.birthDate);
          }
          this.users.set(user.id, user);
        });
      }

      if (matchesData) {
        const matches = JSON.parse(matchesData) as Match[];
        matches.forEach(match => {
          match.createdAt = new Date(match.createdAt);
          match.updatedAt = new Date(match.updatedAt);
          this.matches.set(match.id, match);
        });
      }

      if (messagesData) {
        const messages = JSON.parse(messagesData) as Message[];
        messages.forEach(message => {
          message.createdAt = new Date(message.createdAt);
          message.updatedAt = new Date(message.updatedAt);
          this.messages.set(message.id, message);
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  public async clear(): Promise<void> {
    this.users.clear();
    this.matches.clear();
    this.messages.clear();
    localStorage.clear();
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
    localStorage.setItem('users', JSON.stringify(Array.from(this.users.values())));
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    localStorage.setItem('users', JSON.stringify(Array.from(this.users.values())));
  }

  // Match operations
  async getMatch(id: string): Promise<Match | null> {
    return this.matches.get(id) || null;
  }

  async getMatches(userId: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      m => m.user1Id === userId || m.user2Id === userId
    );
  }

  async saveMatch(match: Match): Promise<void> {
    this.matches.set(match.id, match);
    localStorage.setItem('matches', JSON.stringify(Array.from(this.matches.values())));
  }

  async deleteMatch(id: string): Promise<void> {
    this.matches.delete(id);
    localStorage.setItem('matches', JSON.stringify(Array.from(this.matches.values())));
  }

  // Message operations
  async getMessage(id: string): Promise<Message | null> {
    return this.messages.get(id) || null;
  }

  async getMessages(matchId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.matchId === matchId);
  }

  async saveMessage(message: Message): Promise<void> {
    this.messages.set(message.id, message);
    localStorage.setItem('messages', JSON.stringify(Array.from(this.messages.values())));
  }

  async deleteMessage(id: string): Promise<void> {
    this.messages.delete(id);
    localStorage.setItem('messages', JSON.stringify(Array.from(this.messages.values())));
  }

  // Additional operations
  async getUserMatches(userId: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      m => m.user1Id === userId || m.user2Id === userId
    );
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      m => m.senderId === userId || m.receiverId === userId
    );
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      m => m.receiverId === userId && !m.isRead
    );
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = await this.getMessage(messageId);
    if (message) {
      message.isRead = true;
      message.updatedAt = new Date();
      await this.saveMessage(message);
    }
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markMessageAsRead(id)));
  }
}

export class StorageService {
  private static instance: StorageService;
  private db: any;
  private auth: any;
  private isInitialized = false;
  private useLocalStorage = false; // 添加这个属性如果不存在
  public readonly STORAGE_KEYS = {
    USERS: 'app_users',
    MATCHES: 'app_matches',
    MESSAGES: 'app_messages',
    CURRENT_USER: 'app_current_user'
  };

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // 获取当前数据库环境配置
      const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      console.log('当前数据库环境:', dbEnv); // 添加日志，查看实际环境
      
      // 根据数据库环境决定存储策略
      switch (dbEnv) {
        case 'mock':
          // Mock数据阶段 - 使用内存存储
          console.log('数据库环境: Mock数据阶段');
          this.useLocalStorage = true;
          this.isInitialized = true; // 确保设置初始化标志
          
          // 初始化 Mock 数据
          await this.initializeMockData();
          return;
          
        case 'local':
          // 本地数据库阶段 - 使用IndexedDB或SQLite
          console.log('数据库环境: 本地数据库阶段');
          const localDbType = process.env.NEXT_PUBLIC_LOCAL_DB_TYPE || 'indexeddb';
          this.useLocalStorage = true;
          this.isInitialized = true; // 添加这行，确保设置初始化标志
          return;
          
        // 在 initialize 方法中的 production 环境部分
        case 'production':
        // 生产环境阶段 - 使用Firebase或其他云服务
        console.log('数据库环境: 生产环境阶段');
        const cloudDbType = process.env.NEXT_PUBLIC_CLOUD_DB_TYPE || 'firebase';
        
        if (cloudDbType === 'firebase') {
          const config = getFirebaseConfig();
          
          // 检查Firebase配置是否有效
          if (!config.firebase.apiKey || config.firebase.apiKey === '') {
            console.warn('Firebase配置无效，回退到本地存储');
            this.useLocalStorage = true;
            this.isInitialized = true; // 确保设置初始化标志
            return;
          }
          
          const app = initializeApp(config.firebase);
          this.db = getFirestore(app);
          this.auth = getAuth(app);
          
          // 匿名登录
          await signInAnonymously(this.auth);
          this.isInitialized = true; // 添加这行，确保设置初始化标志
        } else {
          // 其他云服务的初始化逻辑
          console.log(`使用云服务: ${cloudDbType}`);
          this.useLocalStorage = true; // 临时回退，直到实现其他云服务
          this.isInitialized = true; // 添加这行，确保设置初始化标志
        }
        return;
          
        default:
          // 未知环境 - 回退到本地存储
          console.warn(`未知数据库环境: ${dbEnv}，回退到本地存储`);
          this.useLocalStorage = true;
          return;
      }
    } catch (error) {
      console.error('初始化存储服务失败:', error);
      console.log('回退到本地存储模式');
      this.useLocalStorage = true;
      this.isInitialized = true; // 确保即使出错也设置初始化标志
    }
  }

  // 本地存储方法
  public async setLocalItem(key: string, value: any): Promise<void> {
    try {
      await Storage.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.error('Error setting local storage item:', error);
      throw error;
    }
  }

  public async getLocalItem<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Storage.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting local storage item:', error);
      return null;
    }
  }

  public async removeLocalItem(key: string): Promise<void> {
    try {
      await Storage.remove({ key });
    } catch (error) {
      console.error('Error removing local storage item:', error);
      throw error;
    }
  }

  public async clearLocalStorage(): Promise<void> {
    try {
      await Storage.clear();
    } catch (error) {
      console.error('Error clearing local storage:', error);
      throw error;
    }
  }

  // 云端存储方法
  public async setCloudItem(collectionName: string, docId: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端操作');
      return;
    }

    try {
      if (!this.db) {
        console.warn('Firestore 数据库未初始化，跳过云端操作');
        return;
      }

      const docRef = doc(this.db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error('Error setting cloud storage item:', error);
      // 捕获错误但不抛出
    }
  }

  public async getCloudItem<T>(collectionName: string, docId: string): Promise<T | null> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端查询');
      return null;
    }

    try {
      if (!this.db) {
        console.warn('Firestore 数据库未初始化，返回null');
        return null;
      }

      const docRef = doc(this.db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as T : null;
    } catch (error) {
      console.error('Error getting cloud storage item:', error);
      return null;
    }
  }

  public async getCloudItems<T>(
    collectionName: string,
    field: string,
    value: any
  ): Promise<T[]> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }
  
    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端查询');
      return [];
    }
  
    try {
      // 添加更严格的检查，确保 this.db 已正确初始化
      if (!this.db) {
        console.warn('Firestore 数据库未初始化，返回空数组');
        return [];
      }
  
      const q = query(
        collection(this.db, collectionName),
        where(field, '==', value)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as T);
    } catch (error) {
      console.error('Error getting cloud storage items:', error);
      // 捕获错误但不抛出，返回空数组
      return [];
    }
  }

  public async updateCloudItem(
    collectionName: string,
    docId: string,
    data: Partial<any>
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端操作');
      return;
    }

    try {
      if (!this.db) {
        console.warn('Firestore 数据库未初始化，跳过云端操作');
        return;
      }

      const docRef = doc(this.db, collectionName, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating cloud storage item:', error);
      // 捕获错误但不抛出
    }
  }

  public async deleteCloudItem(collectionName: string, docId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端操作');
      return;
    }

    try {
      if (!this.db) {
        console.warn('Firestore 数据库未初始化，跳过云端操作');
        return;
      }

      const docRef = doc(this.db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting cloud storage item:', error);
      // 捕获错误但不抛出
    }
  }

  // 同步方法
  public async syncToCloud<T>(
    collectionName: string,
    docId: string,
    localKey: string
  ): Promise<void> {
    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端同步');
      return;
    }

    try {
      const localData = await this.getLocalItem<T>(localKey);
      if (localData) {
        await this.setCloudItem(collectionName, docId, localData);
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      // 捕获错误但不抛出
    }
  }

  public async syncFromCloud<T>(
    collectionName: string,
    docId: string,
    localKey: string
  ): Promise<void> {
    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过从云端同步');
      return;
    }

    try {
      const cloudData = await this.getCloudItem<T>(collectionName, docId);
      if (cloudData) {
        await this.setLocalItem(localKey, cloudData);
      }
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      // 捕获错误但不抛出
    }
  }

  // 用户数据存储
  public async saveUsers(users: User[]): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.USERS, users);
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  public async getUsers(): Promise<User[]> {
    try {
      const users = await this.getLocalItem<User[]>(this.STORAGE_KEYS.USERS);
      return users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  public async saveCurrentUser(user: User): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.CURRENT_USER, user);
    } catch (error) {
      console.error('Error saving current user:', error);
      throw error;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    try {
      return await this.getLocalItem<User>(this.STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // 匹配数据存储
  public async saveMatches(matches: Match[]): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.MATCHES, matches);
    } catch (error) {
      console.error('Error saving matches:', error);
      throw error;
    }
  }

  public async getMatches(): Promise<Match[]> {
    try {
      const matches = await this.getLocalItem<Match[]>(this.STORAGE_KEYS.MATCHES);
      return matches || [];
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  // 消息数据存储
  public async saveMessages(messages: Message[]): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.MESSAGES, messages);
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  public async getMessages(): Promise<Message[]> {
    try {
      const messages = await this.getLocalItem<Message[]>(this.STORAGE_KEYS.MESSAGES);
      return messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // 清除所有数据
  public async clearAll(): Promise<void> {
    try {
      await this.clearLocalStorage();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // 检查存储是否可用
  public async isStorageAvailable(): Promise<boolean> {
    try {
      const testKey = '__storage_test__';
      await this.setLocalItem(testKey, testKey);
      await this.removeLocalItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

// 添加初始化 Mock 数据的方法（作为类的成员方法）
private async initializeMockData(): Promise<void> {
  try {
    // 强制重新初始化 mock 数据，忽略现有数据
    console.log('强制初始化 Mock 数据...');
    
    // 使用DataServiceFactory获取数据服务实例
    const dataService = await import('../services/data-service-factory').then(module => {
      return module.DataServiceFactory.getInstance();
    });
    
    // 获取用户数据
    const users = await dataService.getUsers();
    const currentUser = users.length > 0 ? users[0] : null;
    
    // 获取匹配数据
    const matches = await dataService.getMatches(currentUser?.id);
    
    // 获取消息数据
    const messages = await dataService.getMessages();
    
    // 保存数据到本地存储
    if (currentUser) {
      await this.setLocalItem(this.STORAGE_KEYS.CURRENT_USER, currentUser);
    }
    
    if (users && users.length > 0) {
      await this.setLocalItem(this.STORAGE_KEYS.USERS, users);
    }
    
    if (matches && matches.length > 0) {
      await this.setLocalItem(this.STORAGE_KEYS.MATCHES, matches);
    }
    
    if (messages && messages.length > 0) {
      await this.setLocalItem(this.STORAGE_KEYS.MESSAGES, messages);
    }
    
    console.log('Mock 数据初始化完成');
  } catch (error) {
    console.error('初始化 Mock 数据失败:', error);
  }
}
}
