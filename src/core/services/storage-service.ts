import { Capacitor } from '@capacitor/core';
import { Storage } from '@capacitor/storage';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { User, Match, Message } from '@/core/lib/db/types';
import { getFirebaseConfig as importedGetFirebaseConfig } from '@/core/lib/db/clients/firebase';
import { DataServiceFactory } from './data-service-factory';
import { IDataService } from './data-service-interface';

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

/**
 * 获取 Firebase 配置
 * 从环境变量中读取 Firebase 配置信息
 * 
 * @deprecated 使用从 @/core/lib/db/clients/firebase 导入的 getFirebaseConfig 代替
 */
function getFirebaseConfig(): StorageConfig {
  // 现在使用导入的函数
  return importedGetFirebaseConfig();
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

/**
 * 本地存储服务实现
 * 使用浏览器的 localStorage 实现存储功能
 */
export class LocalStorageService implements IStorageService {
  private static instance: LocalStorageService;
  private users: Map<string, User> = new Map();
  private matches: Map<string, Match> = new Map();
  private messages: Map<string, Message> = new Map();
  private _isInitialized = false;

  private constructor() {}

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // 加载来自 localStorage 的数据
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
          if (user.lastActive) {
            user.lastActive = new Date(user.lastActive);
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

      this._isInitialized = true;
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
      m => m.users.includes(userId)
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
      m => m.users.includes(userId)
    );
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      m => m.senderId === userId || m.receiverId === userId
    );
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      m => m.receiverId === userId && m.status !== 'read'
    );
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = await this.getMessage(messageId);
    if (message) {
      message.status = 'read';
      message.updatedAt = new Date();
      await this.saveMessage(message);
    }
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markMessageAsRead(id)));
  }
}

/**
 * 存储服务
 * 提供统一的存储接口，支持本地存储和云存储
 */
export class StorageService {
  private static instance: StorageService;
  private db: any;
  private auth: any;
  private _isInitialized = false;
  private useLocalStorage = true; // 默认使用本地存储
  private dataService: IDataService | null = null;
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

  /**
   * 初始化存储服务
   * 根据环境配置初始化相应的存储策略
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // 获取数据服务
      this.dataService = DataServiceFactory.getDataService();
      
      // 获取当前数据库环境配置
      const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      console.log('当前数据库环境:', dbEnv);
      
      // 根据数据库环境决定存储策略
      switch (dbEnv) {
        case 'mock':
          // Mock数据阶段 - 使用内存存储
          console.log('数据库环境: Mock数据阶段');
          this.useLocalStorage = true;
          this._isInitialized = true;
          
          // 初始化 Mock 数据
          await this.initializeMockData();
          break;
          
        case 'local':
          // 本地数据库阶段 - 使用IndexedDB或SQLite
          console.log('数据库环境: 本地数据库阶段');
          this.useLocalStorage = true;
          this._isInitialized = true;
          break;
          
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
              this._isInitialized = true;
              break;
            }
            
            try {
              const app = initializeApp(config.firebase);
              this.db = getFirestore(app);
              this.auth = getAuth(app);
              
              // 匿名登录
              await signInAnonymously(this.auth);
              this.useLocalStorage = false;
            } catch (firebaseError) {
              console.error('初始化Firebase失败:', firebaseError);
              console.warn('回退到本地存储模式');
              this.useLocalStorage = true;
            }
          } else {
            // 其他云服务的初始化逻辑
            console.log(`使用云服务: ${cloudDbType}`);
            this.useLocalStorage = true; // 临时回退，直到实现其他云服务
          }
          this._isInitialized = true;
          break;
          
        default:
          // 未知环境 - 回退到本地存储
          console.warn(`未知数据库环境: ${dbEnv}，回退到本地存储`);
          this.useLocalStorage = true;
          this._isInitialized = true;
          break;
      }
    } catch (error) {
      console.error('初始化存储服务失败:', error);
      console.log('回退到本地存储模式');
      this.useLocalStorage = true;
      this._isInitialized = true;
    }
  }

  /**
   * 检查服务是否已初始化
   * @throws 如果服务未初始化则抛出错误
   */
  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('Storage service not initialized');
    }
  }

  /**
   * 设置本地存储项
   * @param key 键
   * @param value 值
   */
  public async setLocalItem(key: string, value: any): Promise<void> {
    this.checkInitialized();
    
    try {
      await Storage.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.error('Error setting local storage item:', error);
      
      // 尝试使用localStorage作为后备
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (fallbackError) {
        console.error('Fallback to localStorage failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * 获取本地存储项
   * @param key 键
   * @returns 获取的值或null
   */
  public async getLocalItem<T>(key: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      const { value } = await Storage.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting local storage item:', error);
      
      // 尝试使用localStorage作为后备
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (fallbackError) {
        console.error('Fallback to localStorage failed:', fallbackError);
        return null;
      }
    }
  }

  /**
   * 删除本地存储项
   * @param key 键
   */
  public async removeLocalItem(key: string): Promise<void> {
    this.checkInitialized();
    
    try {
      await Storage.remove({ key });
    } catch (error) {
      console.error('Error removing local storage item:', error);
      
      // 尝试使用localStorage作为后备
      try {
        localStorage.removeItem(key);
      } catch (fallbackError) {
        console.error('Fallback to localStorage failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * 清空本地存储
   */
  public async clearLocalStorage(): Promise<void> {
    this.checkInitialized();
    
    try {
      await Storage.clear();
    } catch (error) {
      console.error('Error clearing local storage:', error);
      
      // 尝试使用localStorage作为后备
      try {
        localStorage.clear();
      } catch (fallbackError) {
        console.error('Fallback to localStorage failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * 设置云端存储项
   * @param collectionName 集合名称
   * @param docId 文档ID
   * @param data 数据
   */
  public async setCloudItem(collectionName: string, docId: string, data: any): Promise<void> {
    this.checkInitialized();

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
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error setting cloud storage item:', error);
      // 捕获错误但不抛出，以便应用可以继续运行
    }
  }

  /**
   * 获取云端存储项
   * @param collectionName 集合名称
   * @param docId 文档ID
   * @returns 获取的值或null
   */
  public async getCloudItem<T>(collectionName: string, docId: string): Promise<T | null> {
    this.checkInitialized();

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
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 处理日期字段
        if (data.createdAt && data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt && data.updatedAt.toDate) {
          data.updatedAt = data.updatedAt.toDate();
        }
        
        return data as T;
      }
      return null;
    } catch (error) {
      console.error('Error getting cloud storage item:', error);
      return null;
    }
  }

  /**
   * 获取云端存储项列表
   * @param collectionName 集合名称
   * @param field 字段
   * @param value 值
   * @returns 获取的值列表
   */
  public async getCloudItems<T>(
    collectionName: string,
    field: string,
    value: any
  ): Promise<T[]> {
    this.checkInitialized();
  
    // 检查是否使用本地存储模式
    if (this.useLocalStorage) {
      console.log('使用本地存储模式，跳过云端查询');
      return [];
    }
  
    try {
      // 更严格的检查，确保 this.db 已正确初始化
      if (!this.db) {
        console.warn('Firestore 数据库未初始化，返回空数组');
        return [];
      }
  
      const q = query(
        collection(this.db, collectionName),
        where(field, '==', value)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        
        // 处理日期字段
        if (data.createdAt && data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt && data.updatedAt.toDate) {
          data.updatedAt = data.updatedAt.toDate();
        }
        
        return data as T;
      });
    } catch (error) {
      console.error('Error getting cloud storage items:', error);
      // 捕获错误但不抛出，返回空数组
      return [];
    }
  }

  /**
   * 更新云端存储项
   * @param collectionName 集合名称
   * @param docId 文档ID
   * @param data 数据
   */
  public async updateCloudItem(
    collectionName: string,
    docId: string,
    data: Partial<any>
  ): Promise<void> {
    this.checkInitialized();

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
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating cloud storage item:', error);
      // 捕获错误但不抛出，以便应用可以继续运行
    }
  }

  /**
   * 删除云端存储项
   * @param collectionName 集合名称
   * @param docId 文档ID
   */
  public async deleteCloudItem(collectionName: string, docId: string): Promise<void> {
    this.checkInitialized();

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
      // 捕获错误但不抛出，以便应用可以继续运行
    }
  }

  /**
   * 将本地数据同步到云端
   * @param collectionName 集合名称
   * @param docId 文档ID
   * @param localKey 本地键
   */
  public async syncToCloud<T>(
    collectionName: string,
    docId: string,
    localKey: string
  ): Promise<void> {
    this.checkInitialized();
    
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
      // 捕获错误但不抛出，以便应用可以继续运行
    }
  }

  /**
   * 从云端同步数据到本地
   * @param collectionName 集合名称
   * @param docId 文档ID
   * @param localKey 本地键
   */
  public async syncFromCloud<T>(
    collectionName: string,
    docId: string,
    localKey: string
  ): Promise<void> {
    this.checkInitialized();
    
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
      // 捕获错误但不抛出，以便应用可以继续运行
    }
  }

  /**
   * 保存用户列表
   * @param users 用户列表
   */
  public async saveUsers(users: User[]): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.setLocalItem(this.STORAGE_KEYS.USERS, users);
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表
   * @returns 用户列表
   */
  public async getUsers(): Promise<User[]> {
    this.checkInitialized();
    
    try {
      const users = await this.getLocalItem<User[]>(this.STORAGE_KEYS.USERS);
      return users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * 保存当前用户
   * @param user 用户
   */
  public async saveCurrentUser(user: User): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.setLocalItem(this.STORAGE_KEYS.CURRENT_USER, user);
    } catch (error) {
      console.error('Error saving current user:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户
   * @returns 当前用户或null
   */
  public async getCurrentUser(): Promise<User | null> {
    this.checkInitialized();
    
    try {
      return await this.getLocalItem<User>(this.STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * 保存匹配列表
   * @param matches 匹配列表
   */
  public async saveMatches(matches: Match[]): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.setLocalItem(this.STORAGE_KEYS.MATCHES, matches);
    } catch (error) {
      console.error('Error saving matches:', error);
      throw error;
    }
  }

  /**
   * 获取匹配列表
   * @returns 匹配列表
   */
  public async getMatches(): Promise<Match[]> {
    this.checkInitialized();
    
    try {
      const matches = await this.getLocalItem<Match[]>(this.STORAGE_KEYS.MATCHES);
      return matches || [];
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  /**
   * 保存消息列表
   * @param messages 消息列表
   */
  public async saveMessages(messages: Message[]): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.setLocalItem(this.STORAGE_KEYS.MESSAGES, messages);
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  /**
   * 获取消息列表
   * @returns 消息列表
   */
  public async getMessages(): Promise<Message[]> {
    this.checkInitialized();
    
    try {
      const messages = await this.getLocalItem<Message[]>(this.STORAGE_KEYS.MESSAGES);
      return messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * 清除所有数据
   */
  public async clearAll(): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.clearLocalStorage();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * 检查存储是否可用
   * @returns 如果存储可用则返回true，否则返回false
   */
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

  /**
   * 初始化 Mock 数据
   * 从数据服务获取 Mock 数据并保存到本地存储
   */
  private async initializeMockData(): Promise<void> {
    try {
      if (!this.dataService) {
        console.error('数据服务未初始化，无法加载 Mock 数据');
        return;
      }
      
      console.log('正在初始化 Mock 数据...');
      
      // 获取用户数据
      const users = await this.dataService.getUsers();
      const currentUser = users.length > 0 ? users[0] : null;
      
      // 获取匹配数据
      let matches: Match[] = [];
      if (currentUser) {
        matches = await this.dataService.getMatches(currentUser.id);
      }
      
      // 获取消息数据
      let messages: Message[] = [];
      for (const match of matches) {
        const matchMessages = await this.dataService.getMessages(match.id);
        messages = [...messages, ...matchMessages];
      }
      
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
