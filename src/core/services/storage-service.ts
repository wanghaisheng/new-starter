import { User, Match, Message } from '../models/user';
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
    
    // 导入 mock 数据
    const { mockUsers, mockCurrentUser, mockMatches, mockMessages } = await import('../../mock/data/user-data');
    
    // 保存 mock 数据到本地存储
    if (mockCurrentUser) {
      await this.setLocalItem(this.STORAGE_KEYS.CURRENT_USER, mockCurrentUser);
    }
    
    if (mockUsers && mockUsers.length > 0) {
      await this.setLocalItem(this.STORAGE_KEYS.USERS, mockUsers);
    }
    
    if (mockMatches && mockMatches.length > 0) {
      await this.setLocalItem(this.STORAGE_KEYS.MATCHES, mockMatches);
    }
    
    if (mockMessages && mockMessages.length > 0) {
      await this.setLocalItem(this.STORAGE_KEYS.MESSAGES, mockMessages);
    }
    
    console.log('Mock 数据初始化完成');
  } catch (error) {
    console.error('初始化 Mock 数据失败:', error);
  }
}
}
